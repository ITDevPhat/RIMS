using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Auth;
using Rms.Application.Common;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;
using Rms.Infrastructure.Security;
using AuthRoleDto = Rms.Application.Auth.RoleDto;

namespace Rms.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly RmsDbContext _dbContext;
    private readonly IPasswordService _passwordService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IAuditService _auditService;
    private readonly IUserContext _userContext;

    public AuthService(
        RmsDbContext dbContext,
        IPasswordService passwordService,
        IJwtTokenService jwtTokenService,
        IAuditService auditService,
        IUserContext userContext)
    {
        _dbContext = dbContext;
        _passwordService = passwordService;
        _jwtTokenService = jwtTokenService;
        _auditService = auditService;
        _userContext = userContext;
    }

    public async Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalized = request.UsernameOrEmail.Trim();
        var user = await _dbContext.Users
            .Include(x => x.Department)
            .Include(x => x.UserPreference)
            .Include(x => x.UserRoleUsers.Where(ur => ur.IsActive))
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions.Where(rp => rp.IsAllowed))
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(x =>
                x.DeletedAt == null &&
                (x.Username == normalized || x.Email == normalized),
                cancellationToken);

        if (user is null)
        {
            await _auditService.WriteLoginEventAsync(null, normalized, "login_failed", false, "User not found", cancellationToken);
            return ServiceResult<LoginResponse>.Fail("Invalid username/email or password.");
        }

        if (!string.Equals(user.AccountStatus, "active", StringComparison.OrdinalIgnoreCase))
        {
            await _auditService.WriteLoginEventAsync(user.UserId, normalized, "login_failed", false, "Account is not active", cancellationToken);
            return ServiceResult<LoginResponse>.Fail("Account is not active.");
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash) || !_passwordService.Verify(request.Password, user.PasswordHash))
        {
            await _auditService.WriteLoginEventAsync(user.UserId, normalized, "login_failed", false, "Invalid password", cancellationToken);
            return ServiceResult<LoginResponse>.Fail("Invalid username/email or password.");
        }

        await _dbContext.Users
            .Where(x => x.UserId == user.UserId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.FailedLoginCount, 0)
                .SetProperty(x => x.LastLoginAt, DateTime.UtcNow)
                .SetProperty(x => x.LastLoginIp, _userContext.IpAddress),
                cancellationToken);

        var session = new LoginSession
        {
            UserId = user.UserId,
            IpAddress = _userContext.IpAddress,
            UserAgent = _userContext.UserAgent,
            DeviceName = "web",
            LoginAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            IsActive = true
        };

        _dbContext.LoginSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var profile = MapProfile(user);
        var token = _jwtTokenService.CreateToken(profile, session.SessionId);
        session.SessionTokenHash = _jwtTokenService.HashToken(token.Token);
        session.ExpiresAt = token.ExpiresAt;
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _auditService.WriteLoginEventAsync(user.UserId, normalized, "login_success", true, null, cancellationToken);
        return ServiceResult<LoginResponse>.Ok(new LoginResponse(token.Token, token.ExpiresAt, profile));
    }

    public async Task<ServiceResult<object>> LogoutAsync(CancellationToken cancellationToken = default)
    {
        var current = _userContext.User;
        if (current?.SessionId is not null)
        {
            var session = await _dbContext.LoginSessions
                .FirstOrDefaultAsync(x => x.SessionId == current.SessionId.Value && x.IsActive, cancellationToken);

            if (session is not null)
            {
                session.IsActive = false;
                session.LogoutAt = DateTime.UtcNow;
                session.LogoutReason = "user_logout";
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            await _auditService.WriteLoginEventAsync(current.UserId, current.Username, "logout", true, null, cancellationToken);
        }

        return ServiceResult<object>.Ok(new { });
    }

    public async Task<ServiceResult<UserProfileDto>> GetMeAsync(CancellationToken cancellationToken = default)
    {
        var userId = _userContext.User?.UserId;
        if (userId is null)
        {
            return ServiceResult<UserProfileDto>.Fail("Unauthenticated.");
        }

        var user = await LoadUserGraph(userId.Value, cancellationToken);
        if (user is null)
        {
            return ServiceResult<UserProfileDto>.Fail("User not found.");
        }

        return ServiceResult<UserProfileDto>.Ok(MapProfile(user));
    }

    public async Task<ServiceResult<object>> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (request.NewPassword != request.ConfirmPassword)
        {
            return ServiceResult<object>.Fail("New password confirmation does not match.");
        }

        if (!IsStrongPassword(request.NewPassword))
        {
            return ServiceResult<object>.Fail("New password must include uppercase, lowercase, number, and special character.");
        }

        var userId = _userContext.User?.UserId;
        if (userId is null)
        {
            return ServiceResult<object>.Fail("Unauthenticated.");
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == userId.Value && x.DeletedAt == null, cancellationToken);
        if (user is null)
        {
            return ServiceResult<object>.Fail("User not found.");
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash) || !_passwordService.Verify(request.CurrentPassword, user.PasswordHash))
        {
            await _auditService.WriteLoginEventAsync(user.UserId, user.Username, "password_changed", false, "Invalid current password", cancellationToken);
            return ServiceResult<object>.Fail("Current password is incorrect.");
        }

        user.PasswordHash = _passwordService.Hash(request.NewPassword);
        user.PasswordChangedAt = DateTime.UtcNow;
        user.MustChangePassword = false;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = user.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _auditService.WriteLoginEventAsync(user.UserId, user.Username, "password_changed", true, null, cancellationToken);
        await _auditService.WriteActivityAsync("user", "update", "Password changed", "User", user.UserId, user.Username, cancellationToken: cancellationToken);
        return ServiceResult<object>.Ok(new { });
    }

    private static bool IsStrongPassword(string password)
    {
        return password.Length >= 8 &&
            password.Any(char.IsUpper) &&
            password.Any(char.IsLower) &&
            password.Any(char.IsDigit) &&
            password.Any(ch => !char.IsLetterOrDigit(ch));
    }

    private Task<User?> LoadUserGraph(long userId, CancellationToken cancellationToken)
    {
        return _dbContext.Users
            .Include(x => x.Department)
            .Include(x => x.UserPreference)
            .Include(x => x.UserRoleUsers.Where(ur => ur.IsActive))
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions.Where(rp => rp.IsAllowed))
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.DeletedAt == null, cancellationToken);
    }

    private static UserProfileDto MapProfile(User user)
    {
        var roles = user.UserRoleUsers
            .Where(ur => ur.IsActive && ur.Role.DeletedAt == null && ur.Role.IsActive)
            .Select(ur => new AuthRoleDto(ur.Role.RoleId, ur.Role.RoleCode, ur.Role.RoleName))
            .DistinctBy(r => r.RoleId)
            .OrderBy(r => r.RoleCode)
            .ToList();

        var permissions = user.IsSystemAdmin
            ? user.UserRoleUsers.SelectMany(ur => ur.Role.RolePermissions.Select(rp => rp.Permission.PermissionCode ?? $"{rp.Permission.ModuleCode}.{rp.Permission.ActionCode}"))
            : user.UserRoleUsers
                .Where(ur => ur.IsActive && ur.Role.IsActive && ur.Role.DeletedAt == null)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Where(rp => rp.IsAllowed && rp.Permission.IsActive)
                .Select(rp => rp.Permission.PermissionCode ?? $"{rp.Permission.ModuleCode}.{rp.Permission.ActionCode}");

        return new UserProfileDto(
            user.UserId,
            user.Username,
            user.Email,
            user.FullName,
            user.Initials,
            user.PhoneNumber,
            user.AvatarUrl,
            user.Title,
            user.DepartmentId,
            user.Department?.DepartmentName,
            user.AccountStatus,
            user.IsSystemAdmin,
            user.MustChangePassword,
            user.LastLoginAt,
            roles,
            permissions.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Order().ToList(),
            user.UserPreference is null
                ? null
                : new AuthPreferenceDto(
                    user.UserPreference.AppearanceMode,
                    user.UserPreference.LanguageCode,
                    user.UserPreference.EnableInAppNotification,
                    user.UserPreference.EnableEmailNotification,
                    user.UserPreference.ReceiveDeadlineNotification,
                    user.UserPreference.ReceiveTrainingNotification,
                    user.UserPreference.ReceiveEthicsNotification,
                    user.UserPreference.AutoMarkReadOnOpen));
    }
}
