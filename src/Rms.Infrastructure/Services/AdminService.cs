using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;
using Rms.Infrastructure.Security;
using AdminRoleDto = Rms.Application.Admin.RoleDto;

namespace Rms.Infrastructure.Services;

public sealed class AdminService : IAdminService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly RmsDbContext _dbContext;
    private readonly IPasswordService _passwordService;
    private readonly IAuditService _auditService;
    private readonly IUserContext _userContext;

    public AdminService(
        RmsDbContext dbContext,
        IPasswordService passwordService,
        IAuditService auditService,
        IUserContext userContext)
    {
        _dbContext = dbContext;
        _passwordService = passwordService;
        _auditService = auditService;
        _userContext = userContext;
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(UserListQuery query, CancellationToken cancellationToken = default)
    {
        var users = UserGraph().Where(x => x.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            users = users.Where(x => x.Username.Contains(search) || x.Email.Contains(search) || x.FullName.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.AccountStatus))
        {
            users = users.Where(x => x.AccountStatus == query.AccountStatus);
        }

        if (query.DepartmentId is not null)
        {
            users = users.Where(x => x.DepartmentId == query.DepartmentId.Value);
        }

        if (query.RoleId is not null)
        {
            users = users.Where(x => x.UserRoleUsers.Any(ur => ur.IsActive && ur.RoleId == query.RoleId.Value));
        }

        if (!string.IsNullOrWhiteSpace(query.Title))
        {
            users = users.Where(x => x.Title != null && x.Title.Contains(query.Title));
        }

        var total = await users.CountAsync(cancellationToken);
        var items = await users
            .OrderBy(x => x.FullName)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<UserDto>.Create(items.Select(MapUser).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<UserDto> GetUserAsync(long id, CancellationToken cancellationToken = default)
    {
        var user = await UserGraph().FirstOrDefaultAsync(x => x.UserId == id && x.DeletedAt == null, cancellationToken);
        return user is null ? throw new NotFoundException("User not found.") : MapUser(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.Users.AnyAsync(x => x.Username == request.Username || x.Email == request.Email, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Username or email already exists.");
        }

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = _passwordService.Hash(request.Password),
            FullName = request.FullName.Trim(),
            Initials = request.Initials,
            PhoneNumber = request.PhoneNumber,
            AvatarUrl = request.AvatarUrl,
            Title = request.Title,
            DepartmentId = request.DepartmentId,
            AccountStatus = "active",
            IsSystemAdmin = request.IsSystemAdmin,
            EmailConfirmed = false,
            MustChangePassword = request.MustChangePassword,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await SyncUserRolesAsync(user.UserId, request.RoleIds, cancellationToken);

        var created = await GetUserEntityAsync(user.UserId, cancellationToken);
        await _auditService.WriteActivityAsync("user", "create", $"Created user {user.Username}", "User", user.UserId, user.Username, newValueJson: Serialize(MapUser(created)), cancellationToken: cancellationToken);
        return MapUser(created);
    }

    public async Task<UserDto> UpdateUserAsync(long id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetUserEntityAsync(id, cancellationToken);
        var before = MapUser(user);

        user.Email = request.Email.Trim();
        user.FullName = request.FullName.Trim();
        user.Initials = request.Initials;
        user.PhoneNumber = request.PhoneNumber;
        user.AvatarUrl = request.AvatarUrl;
        user.Title = request.Title;
        user.DepartmentId = request.DepartmentId;
        user.AccountStatus = request.AccountStatus;
        user.IsSystemAdmin = request.IsSystemAdmin;
        user.MustChangePassword = request.MustChangePassword;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = _userContext.User?.UserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await SyncUserRolesAsync(user.UserId, request.RoleIds, cancellationToken);

        var updated = await GetUserEntityAsync(id, cancellationToken);
        await _auditService.WriteActivityAsync("user", "update", $"Updated user {user.Username}", "User", user.UserId, user.Username, Serialize(before), Serialize(MapUser(updated)), cancellationToken);
        return MapUser(updated);
    }

    public async Task DeleteUserAsync(long id, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id && x.DeletedAt == null, cancellationToken);
        if (user is null)
        {
            throw new NotFoundException("User not found.");
        }

        var before = Serialize(new { user.UserId, user.Username, user.Email, user.AccountStatus });
        user.DeletedAt = DateTime.UtcNow;
        user.DeletedBy = _userContext.User?.UserId;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("user", "delete", $"Deleted user {user.Username}", "User", user.UserId, user.Username, before, cancellationToken: cancellationToken);
    }

    public Task<UserDto> LockUserAsync(long id, CancellationToken cancellationToken = default)
    {
        return ChangeUserStatusAsync(id, "locked", "Locked user", cancellationToken);
    }

    public Task<UserDto> UnlockUserAsync(long id, CancellationToken cancellationToken = default)
    {
        return ChangeUserStatusAsync(id, "active", "Unlocked user", cancellationToken);
    }

    public async Task<string> ResetPasswordAsync(long id, ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == id && x.DeletedAt == null, cancellationToken);
        if (user is null)
        {
            throw new NotFoundException("User not found.");
        }

        var temporaryPassword = string.IsNullOrWhiteSpace(request.NewPassword)
            ? $"Rms@{Random.Shared.Next(100000, 999999)}"
            : request.NewPassword;

        user.PasswordHash = _passwordService.Hash(temporaryPassword);
        user.PasswordChangedAt = DateTime.UtcNow;
        user.MustChangePassword = request.MustChangePassword;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("user", "update", $"Reset password for {user.Username}", "User", user.UserId, user.Username, newValueJson: Serialize(new { temporaryPassword }), cancellationToken: cancellationToken);
        await _auditService.WriteLoginEventAsync(user.UserId, user.Username, "password_reset", true, null, cancellationToken);
        return temporaryPassword;
    }

    public async Task<PagedResult<AdminRoleDto>> GetRolesAsync(PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var roles = _dbContext.Roles
            .Include(x => x.UserRoles)
            .Where(x => x.DeletedAt == null);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            roles = roles.Where(x => x.RoleCode.Contains(search) || x.RoleName.Contains(search));
        }

        var total = await roles.CountAsync(cancellationToken);
        var roleEntities = await roles
            .OrderBy(x => x.RoleCode)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        var items = roleEntities.Select(MapRole).ToList();

        return PagedResult<AdminRoleDto>.Create(items, query.Page, query.PageSize, total);
    }

    public async Task<AdminRoleDto> GetRoleAsync(long id, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles
            .Include(x => x.UserRoles)
            .FirstOrDefaultAsync(x => x.RoleId == id && x.DeletedAt == null, cancellationToken);
        return role is null ? throw new NotFoundException("Role not found.") : MapRole(role);
    }

    public async Task<AdminRoleDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.Roles.AnyAsync(x => x.RoleCode == request.RoleCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Role code already exists.");
        }

        var role = new Role
        {
            RoleCode = request.RoleCode.Trim(),
            RoleName = request.RoleName.Trim(),
            Description = request.Description,
            IsActive = request.IsActive,
            IsSystem = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };

        _dbContext.Roles.Add(role);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await SyncRolePermissionsAsync(role.RoleId, request.PermissionIds, cancellationToken);

        await _auditService.WriteActivityAsync("role", "create", $"Created role {role.RoleCode}", "Role", role.RoleId, role.RoleCode, newValueJson: Serialize(MapRole(role)), cancellationToken: cancellationToken);
        return MapRole(role);
    }

    public async Task<AdminRoleDto> UpdateRoleAsync(long id, UpdateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.RoleId == id && x.DeletedAt == null, cancellationToken);
        if (role is null)
        {
            throw new NotFoundException("Role not found.");
        }

        var before = MapRole(role);
        role.RoleName = request.RoleName.Trim();
        role.Description = request.Description;
        role.IsActive = request.IsActive;
        role.UpdatedAt = DateTime.UtcNow;
        role.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await SyncRolePermissionsAsync(role.RoleId, request.PermissionIds, cancellationToken);

        await _auditService.WriteActivityAsync("role", "update", $"Updated role {role.RoleCode}", "Role", role.RoleId, role.RoleCode, Serialize(before), Serialize(MapRole(role)), cancellationToken);
        return MapRole(role);
    }

    public async Task DeleteRoleAsync(long id, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.RoleId == id && x.DeletedAt == null, cancellationToken);
        if (role is null)
        {
            throw new NotFoundException("Role not found.");
        }

        var before = Serialize(MapRole(role));
        role.DeletedAt = DateTime.UtcNow;
        role.DeletedBy = _userContext.User?.UserId;
        role.UpdatedAt = DateTime.UtcNow;
        role.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("role", "delete", $"Deleted role {role.RoleCode}", "Role", role.RoleId, role.RoleCode, before, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<PermissionDto>> GetPermissionsAsync(PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var permissions = _dbContext.Permissions.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            permissions = permissions.Where(x =>
                x.ModuleCode.Contains(search) ||
                x.ModuleName.Contains(search) ||
                x.ActionCode.Contains(search) ||
                x.ActionName.Contains(search));
        }

        var total = await permissions.CountAsync(cancellationToken);
        var items = await permissions
            .OrderBy(x => x.ModuleCode)
            .ThenBy(x => x.ActionCode)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => MapPermission(x))
            .ToListAsync(cancellationToken);

        return PagedResult<PermissionDto>.Create(items, query.Page, query.PageSize, total);
    }

    public async Task<PermissionMatrixDto> GetPermissionMatrixAsync(CancellationToken cancellationToken = default)
    {
        var permissions = await _dbContext.Permissions
            .OrderBy(x => x.ModuleCode)
            .ThenBy(x => x.ActionCode)
            .ToListAsync(cancellationToken);

        var modules = permissions
            .GroupBy(x => new { x.ModuleCode, x.ModuleName })
            .Select(x => new PermissionModuleDto(x.Key.ModuleCode, x.Key.ModuleName, x.Select(MapPermission).ToList()))
            .ToList();

        return new PermissionMatrixDto(modules);
    }

    public async Task<PermissionDto> UpdatePermissionAsync(long id, UpdatePermissionRequest request, CancellationToken cancellationToken = default)
    {
        var permission = await _dbContext.Permissions.FirstOrDefaultAsync(x => x.PermissionId == id, cancellationToken);
        if (permission is null)
        {
            throw new NotFoundException("Permission not found.");
        }

        var before = MapPermission(permission);
        permission.ModuleName = string.IsNullOrWhiteSpace(request.ModuleName) ? permission.ModuleName : request.ModuleName;
        permission.ActionName = string.IsNullOrWhiteSpace(request.ActionName) ? permission.ActionName : request.ActionName;
        permission.Description = request.Description;
        permission.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _auditService.WriteActivityAsync("permission", "update", $"Updated permission {permission.ModuleCode}.{permission.ActionCode}", "Permission", permission.PermissionId, permission.PermissionCode, Serialize(before), Serialize(MapPermission(permission)), cancellationToken);
        return MapPermission(permission);
    }

    public async Task<RolePermissionMatrixDto> GetRolePermissionsAsync(long roleId, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles
            .Include(x => x.RolePermissions)
            .FirstOrDefaultAsync(x => x.RoleId == roleId && x.DeletedAt == null, cancellationToken);

        if (role is null)
        {
            throw new NotFoundException("Role not found.");
        }

        var allowedPermissionIds = role.RolePermissions
            .Where(x => x.IsAllowed)
            .Select(x => x.PermissionId)
            .ToHashSet();

        var permissions = await _dbContext.Permissions
            .OrderBy(x => x.ModuleCode)
            .ThenBy(x => x.ActionCode)
            .ToListAsync(cancellationToken);

        var modules = permissions
            .GroupBy(x => new { x.ModuleCode, x.ModuleName })
            .Select(group => new RolePermissionModuleDto(
                group.Key.ModuleCode,
                group.Key.ModuleName,
                group.Select(permission => new RolePermissionActionDto(
                    permission.ActionCode,
                    permission.ActionName,
                    permission.PermissionCode ?? $"{permission.ModuleCode}.{permission.ActionCode}",
                    permission.PermissionId,
                    allowedPermissionIds.Contains(permission.PermissionId))).ToList()))
            .ToList();

        return new RolePermissionMatrixDto(role.RoleId, role.RoleName, modules);
    }

    public async Task<RolePermissionMatrixDto> UpdateRolePermissionsAsync(long roleId, IReadOnlyList<long> permissionIds, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.RoleId == roleId && x.DeletedAt == null, cancellationToken);
        if (role is null)
        {
            throw new NotFoundException("Role not found.");
        }

        await SyncRolePermissionsAsync(roleId, permissionIds, cancellationToken);
        await _auditService.WriteActivityAsync("role", "update", $"Updated permissions for role {role.RoleCode}", "Role", role.RoleId, role.RoleCode, newValueJson: Serialize(new { permissionIds }), cancellationToken: cancellationToken);
        return await GetRolePermissionsAsync(roleId, cancellationToken);
    }

    public async Task<PagedResult<SystemSettingDto>> GetSettingsAsync(PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var settings = _dbContext.SystemSettings.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            settings = settings.Where(x => x.SettingKey.Contains(search) || x.SettingName.Contains(search) || x.SettingGroup.Contains(search));
        }

        var total = await settings.CountAsync(cancellationToken);
        var items = await settings
            .OrderBy(x => x.SettingGroup)
            .ThenBy(x => x.SettingKey)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => MapSetting(x))
            .ToListAsync(cancellationToken);

        return PagedResult<SystemSettingDto>.Create(items, query.Page, query.PageSize, total);
    }

    public async Task<SystemSettingDto> GetSettingByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(x => x.SettingKey == key, cancellationToken);
        return setting is null ? throw new NotFoundException("Setting not found.") : MapSetting(setting);
    }

    public async Task<IReadOnlyList<SystemSettingDto>> GetSettingsByGroupAsync(string groupCode, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SystemSettings
            .Where(x => x.SettingGroup == groupCode)
            .OrderBy(x => x.SettingKey)
            .Select(x => MapSetting(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<SystemSettingDto> CreateSettingAsync(CreateSettingRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.SystemSettings.AnyAsync(x => x.SettingKey == request.SettingKey, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Setting key already exists.");
        }

        var setting = new SystemSetting
        {
            SettingKey = request.SettingKey.Trim(),
            SettingValue = request.SettingValue,
            ValueType = request.ValueType,
            SettingGroup = request.SettingGroup,
            SettingName = request.SettingName,
            Description = request.Description,
            IsPublic = request.IsPublic,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };

        _dbContext.SystemSettings.Add(setting);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("setting", "create", $"Created setting {setting.SettingKey}", "SystemSetting", setting.SettingId, setting.SettingKey, newValueJson: Serialize(MapSetting(setting)), cancellationToken: cancellationToken);
        return MapSetting(setting);
    }

    public async Task<SystemSettingDto> UpdateSettingAsync(long id, UpdateSettingRequest request, CancellationToken cancellationToken = default)
    {
        var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(x => x.SettingId == id, cancellationToken);
        if (setting is null)
        {
            throw new NotFoundException("Setting not found.");
        }

        return await UpdateSettingCoreAsync(setting, request, cancellationToken);
    }

    public async Task<SystemSettingDto> UpdateSettingByKeyAsync(string key, UpdateSettingRequest request, CancellationToken cancellationToken = default)
    {
        var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(x => x.SettingKey == key, cancellationToken);
        if (setting is null)
        {
            throw new NotFoundException("Setting not found.");
        }

        return await UpdateSettingCoreAsync(setting, request, cancellationToken);
    }

    private async Task<SystemSettingDto> UpdateSettingCoreAsync(SystemSetting setting, UpdateSettingRequest request, CancellationToken cancellationToken)
    {
        var before = MapSetting(setting);
        setting.SettingValue = request.SettingValue;
        setting.ValueType = request.ValueType;
        setting.SettingGroup = request.SettingGroup;
        setting.SettingName = request.SettingName;
        setting.Description = request.Description;
        setting.IsPublic = request.IsPublic;
        setting.IsActive = request.IsActive;
        setting.UpdatedAt = DateTime.UtcNow;
        setting.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _auditService.WriteActivityAsync("setting", "update", $"Updated setting {setting.SettingKey}", "SystemSetting", setting.SettingId, setting.SettingKey, Serialize(before), Serialize(MapSetting(setting)), cancellationToken);
        return MapSetting(setting);
    }

    public async Task DeleteSettingAsync(long id, CancellationToken cancellationToken = default)
    {
        var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(x => x.SettingId == id, cancellationToken);
        if (setting is null)
        {
            throw new NotFoundException("Setting not found.");
        }

        var before = Serialize(MapSetting(setting));
        _dbContext.SystemSettings.Remove(setting);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("setting", "delete", $"Deleted setting {setting.SettingKey}", "SystemSetting", id, setting.SettingKey, before, cancellationToken: cancellationToken);
    }

    private async Task<UserDto> ChangeUserStatusAsync(long id, string status, string summary, CancellationToken cancellationToken)
    {
        var user = await GetUserEntityAsync(id, cancellationToken);
        var before = MapUser(user);
        user.AccountStatus = status;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("user", "update", $"{summary} {user.Username}", "User", user.UserId, user.Username, Serialize(before), Serialize(MapUser(user)), cancellationToken);
        return MapUser(user);
    }

    private IQueryable<User> UserGraph()
    {
        return _dbContext.Users
            .Include(x => x.Department)
            .Include(x => x.UserRoleUsers.Where(ur => ur.IsActive))
            .ThenInclude(ur => ur.Role);
    }

    private async Task<User> GetUserEntityAsync(long id, CancellationToken cancellationToken)
    {
        var user = await UserGraph().FirstOrDefaultAsync(x => x.UserId == id && x.DeletedAt == null, cancellationToken);
        return user ?? throw new NotFoundException("User not found.");
    }

    private async Task SyncUserRolesAsync(long userId, IReadOnlyList<long>? roleIds, CancellationToken cancellationToken)
    {
        if (roleIds is null)
        {
            return;
        }

        var targetRoleIds = roleIds.Distinct().ToHashSet();
        var current = await _dbContext.UserRoles.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        foreach (var userRole in current)
        {
            userRole.IsActive = targetRoleIds.Contains(userRole.RoleId);
        }

        foreach (var roleId in targetRoleIds.Except(current.Select(x => x.RoleId)))
        {
            _dbContext.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = roleId,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = _userContext.User?.UserId,
                IsActive = true
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncRolePermissionsAsync(long roleId, IReadOnlyList<long>? permissionIds, CancellationToken cancellationToken)
    {
        if (permissionIds is null)
        {
            return;
        }

        var targetPermissionIds = permissionIds.Distinct().ToHashSet();
        var current = await _dbContext.RolePermissions.Where(x => x.RoleId == roleId).ToListAsync(cancellationToken);
        foreach (var rolePermission in current)
        {
            rolePermission.IsAllowed = targetPermissionIds.Contains(rolePermission.PermissionId);
        }

        foreach (var permissionId in targetPermissionIds.Except(current.Select(x => x.PermissionId)))
        {
            _dbContext.RolePermissions.Add(new RolePermission
            {
                RoleId = roleId,
                PermissionId = permissionId,
                IsAllowed = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = _userContext.User?.UserId
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static UserDto MapUser(User user)
    {
        var roles = user.UserRoleUsers
            .Where(x => x.IsActive && x.Role.DeletedAt == null)
            .Select(x => MapRole(x.Role))
            .DistinctBy(x => x.RoleId)
            .OrderBy(x => x.RoleCode)
            .ToList();

        return new UserDto(
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
            user.CreatedAt,
            user.LastLoginAt,
            roles);
    }

    private static AdminRoleDto MapRole(Role role)
    {
        var userCount = role.UserRoles.Count(x => x.IsActive);
        return new AdminRoleDto(role.RoleId, role.RoleCode, role.RoleName, role.Description, role.IsSystem, role.IsActive, userCount, role.CreatedAt);
    }

    private static PermissionDto MapPermission(Permission permission)
    {
        return new PermissionDto(
            permission.PermissionId,
            permission.ModuleCode,
            permission.ModuleName,
            permission.ActionCode,
            permission.ActionName,
            permission.PermissionCode ?? $"{permission.ModuleCode}.{permission.ActionCode}",
            permission.Description,
            permission.IsActive);
    }

    private static SystemSettingDto MapSetting(SystemSetting setting)
    {
        return new SystemSettingDto(
            setting.SettingId,
            setting.SettingKey,
            setting.SettingValue,
            setting.ValueType,
            setting.SettingGroup,
            setting.SettingName,
            setting.Description,
            setting.IsPublic,
            setting.IsActive);
    }

    private static string Serialize(object value)
    {
        return JsonSerializer.Serialize(value, JsonOptions);
    }
}
