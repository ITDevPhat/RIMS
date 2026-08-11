using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<AuthService> _logger;
    private readonly bool _measureDatabaseLatency;

    public AuthService(
        RmsDbContext dbContext,
        IPasswordService passwordService,
        IJwtTokenService jwtTokenService,
        IAuditService auditService,
        IUserContext userContext,
        ILogger<AuthService> logger,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _passwordService = passwordService;
        _jwtTokenService = jwtTokenService;
        _auditService = auditService;
        _userContext = userContext;
        _logger = logger;
        _measureDatabaseLatency = configuration.GetValue<bool>("Diagnostics:MeasureLoginDatabaseLatency");
    }

    public async Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalized = request.UsernameOrEmail.Trim();
        var totalSw = Stopwatch.StartNew();
        var stepSw = Stopwatch.StartNew();
        _logger.LogInformation("LOGIN START username={Username}", normalized);

        try
        {
            if (_measureDatabaseLatency)
            {
                var dbSw = Stopwatch.StartNew();
                await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
                _logger.LogInformation("DB SELECT 1 latency {ElapsedMs}ms", dbSw.ElapsedMilliseconds);
                stepSw.Restart();
            }

            // Do not load the authorization/profile graph until the supplied password is valid.
            var authUser = await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.DeletedAt == null && (x.Username == normalized || x.Email == normalized))
            .Select(x => new AuthUserProjection(
                x.UserId,
                x.Username,
                x.Email,
                x.PasswordHash,
                x.AccountStatus,
                x.FailedLoginCount,
                x.LockedUntil,
                x.RowVersion))
            .FirstOrDefaultAsync(cancellationToken);
            _logger.LogInformation("LOGIN LoadAuthUser {ElapsedMs}ms", stepSw.ElapsedMilliseconds);

            if (authUser is null)
            {
                await _auditService.WriteLoginEventAsync(null, normalized, "login_failed", false, "User not found", cancellationToken);
                return ServiceResult<LoginResponse>.Fail("Invalid username/email or password.");
            }

            if (!string.Equals(authUser.AccountStatus, "active", StringComparison.OrdinalIgnoreCase))
            {
                await _auditService.WriteLoginEventAsync(authUser.UserId, normalized, "login_failed", false, "Account is not active", cancellationToken);
                return ServiceResult<LoginResponse>.Fail("Account is not active.");
            }

            stepSw.Restart();
            var passwordValid = !string.IsNullOrWhiteSpace(authUser.PasswordHash) &&
                _passwordService.Verify(request.Password, authUser.PasswordHash);
            _logger.LogInformation("LOGIN VerifyPassword {ElapsedMs}ms", stepSw.ElapsedMilliseconds);
            if (!passwordValid)
            {
                await _auditService.WriteLoginEventAsync(authUser.UserId, normalized, "login_failed", false, "Invalid password", cancellationToken);
                return ServiceResult<LoginResponse>.Fail("Invalid username/email or password.");
            }

            stepSw.Restart();
            var profile = await LoadProfileAsync(authUser.UserId, cancellationToken);
            _logger.LogInformation("LOGIN LoadProfile {ElapsedMs}ms", stepSw.ElapsedMilliseconds);
            if (profile is null)
            {
                return ServiceResult<LoginResponse>.Fail("Invalid username/email or password.");
            }

            // BCrypt and all read-only work happen before this short write transaction.
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            var now = DateTime.UtcNow;
            stepSw.Restart();
            var userUpdate = new User { UserId = authUser.UserId, RowVersion = authUser.RowVersion };
            _dbContext.Users.Attach(userUpdate);
            _dbContext.Entry(userUpdate).Property(x => x.RowVersion).OriginalValue = authUser.RowVersion;
            userUpdate.FailedLoginCount = 0;
            userUpdate.LastLoginAt = now;
            userUpdate.LastLoginIp = _userContext.IpAddress;
            _dbContext.Entry(userUpdate).Property(x => x.FailedLoginCount).IsModified = true;
            _dbContext.Entry(userUpdate).Property(x => x.LastLoginAt).IsModified = true;
            _dbContext.Entry(userUpdate).Property(x => x.LastLoginIp).IsModified = true;
            _logger.LogInformation("LOGIN UpdateUserLoginInfo {ElapsedMs}ms", stepSw.ElapsedMilliseconds);

            stepSw.Restart();
            var session = new LoginSession
            {
                UserId = authUser.UserId,
                IpAddress = _userContext.IpAddress,
                UserAgent = _userContext.UserAgent,
                DeviceName = "web",
                LoginAt = now,
                ExpiresAt = now.AddHours(8),
                IsActive = true
            };
            _dbContext.LoginSessions.Add(session);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("LOGIN InsertSession {ElapsedMs}ms", stepSw.ElapsedMilliseconds);

            stepSw.Restart();
            var token = _jwtTokenService.CreateToken(profile, session.SessionId);
            _logger.LogInformation("LOGIN CreateJwt {ElapsedMs}ms", stepSw.ElapsedMilliseconds);

            stepSw.Restart();
            session.SessionTokenHash = _jwtTokenService.HashToken(token.Token);
            session.ExpiresAt = token.ExpiresAt;
            _logger.LogInformation("LOGIN UpdateSession {ElapsedMs}ms", stepSw.ElapsedMilliseconds);

            stepSw.Restart();
            _dbContext.LoginEvents.Add(CreateLoginEvent(authUser.UserId, normalized, "login_success", true, null));
            _logger.LogInformation("LOGIN WriteLoginEvent {ElapsedMs}ms", stepSw.ElapsedMilliseconds);

            stepSw.Restart();
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            _logger.LogInformation("LOGIN FinalSave {ElapsedMs}ms", stepSw.ElapsedMilliseconds);
            return ServiceResult<LoginResponse>.Ok(new LoginResponse(token.Token, token.ExpiresAt, profile));
        }
        finally
        {
            _logger.LogInformation("LOGIN TOTAL {ElapsedMs}ms username={Username}", totalSw.ElapsedMilliseconds, normalized);
        }
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

        var profile = await LoadProfileAsync(userId.Value, cancellationToken);
        if (profile is null)
        {
            return ServiceResult<UserProfileDto>.Fail("User not found.");
        }

        return ServiceResult<UserProfileDto>.Ok(profile);
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

    private async Task<UserProfileDto?> LoadProfileAsync(long userId, CancellationToken cancellationToken)
    {
        var profile = await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.DeletedAt == null)
            .Select(x => new ProfileProjection(
                x.UserId,
                x.Username,
                x.Email,
                x.FullName,
                x.Initials,
                x.PhoneNumber,
                x.AvatarUrl,
                x.Title,
                x.DepartmentId,
                x.Department != null ? x.Department.DepartmentName : null,
                x.AccountStatus,
                x.IsSystemAdmin,
                x.MustChangePassword,
                x.LastLoginAt,
                x.UserRoleUsers
                    .Where(ur => ur.IsActive && ur.Role.DeletedAt == null && ur.Role.IsActive)
                    .Select(ur => new AuthRoleDto(ur.Role.RoleId, ur.Role.RoleCode, ur.Role.RoleName))
                    .ToList(),
                (x.IsSystemAdmin
                    ? x.UserRoleUsers.SelectMany(ur => ur.Role.RolePermissions)
                    : x.UserRoleUsers
                        .Where(ur => ur.IsActive && ur.Role.DeletedAt == null && ur.Role.IsActive)
                        .SelectMany(ur => ur.Role.RolePermissions)
                        .Where(rp => rp.IsAllowed && rp.Permission.IsActive))
                    .Select(rp => rp.Permission.PermissionCode ?? rp.Permission.ModuleCode + "." + rp.Permission.ActionCode)
                    .ToList(),
                x.UserPreference == null
                    ? null
                    : new AuthPreferenceDto(
                        x.UserPreference.AppearanceMode,
                        x.UserPreference.LanguageCode,
                        x.UserPreference.EnableInAppNotification,
                        x.UserPreference.EnableEmailNotification,
                        x.UserPreference.ReceiveDeadlineNotification,
                        x.UserPreference.ReceiveTrainingNotification,
                        x.UserPreference.ReceiveEthicsNotification,
                        x.UserPreference.AutoMarkReadOnOpen)))
            .SingleOrDefaultAsync(cancellationToken);
        if (profile is null) return null;

        return new UserProfileDto(
            profile.UserId,
            profile.Username,
            profile.Email,
            profile.FullName,
            profile.Initials,
            profile.PhoneNumber,
            profile.AvatarUrl,
            profile.Title,
            profile.DepartmentId,
            profile.DepartmentName,
            profile.AccountStatus,
            profile.IsSystemAdmin,
            profile.MustChangePassword,
            profile.LastLoginAt,
            profile.Roles.DistinctBy(role => role.RoleId).OrderBy(role => role.RoleCode).ToList(),
            profile.Permissions.Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().Order().ToList(),
            profile.Preferences);
    }

    private LoginEvent CreateLoginEvent(long? userId, string? usernameOrEmail, string eventType, bool success, string? failureReason) => new()
    {
        UserId = userId,
        UsernameOrEmail = usernameOrEmail,
        EventType = eventType,
        Success = success,
        FailureReason = failureReason,
        IpAddress = _userContext.IpAddress,
        UserAgent = _userContext.UserAgent,
        OccurredAt = DateTime.UtcNow
    };

    private sealed record AuthUserProjection(
        long UserId,
        string Username,
        string Email,
        string? PasswordHash,
        string AccountStatus,
        int FailedLoginCount,
        DateTime? LockedUntil,
        long RowVersion);

    private sealed record ProfileProjection(
        long UserId,
        string Username,
        string Email,
        string FullName,
        string? Initials,
        string? PhoneNumber,
        string? AvatarUrl,
        string? Title,
        long? DepartmentId,
        string? DepartmentName,
        string AccountStatus,
        bool IsSystemAdmin,
        bool MustChangePassword,
        DateTime? LastLoginAt,
        List<AuthRoleDto> Roles,
        List<string> Permissions,
        AuthPreferenceDto? Preferences);

}
