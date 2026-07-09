using Rms.Application.Common;

namespace Rms.Application.Admin;

public interface IAdminService
{
    Task<PagedResult<UserDto>> GetUsersAsync(UserListQuery query, CancellationToken cancellationToken = default);
    Task<UserDto> GetUserAsync(long id, CancellationToken cancellationToken = default);
    Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateUserAsync(long id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(long id, CancellationToken cancellationToken = default);
    Task<UserDto> LockUserAsync(long id, CancellationToken cancellationToken = default);
    Task<UserDto> UnlockUserAsync(long id, CancellationToken cancellationToken = default);
    Task<string> ResetPasswordAsync(long id, ResetPasswordRequest request, CancellationToken cancellationToken = default);

    Task<PagedResult<RoleDto>> GetRolesAsync(PaginationQuery query, CancellationToken cancellationToken = default);
    Task<RoleDto> GetRoleAsync(long id, CancellationToken cancellationToken = default);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);
    Task<RoleDto> UpdateRoleAsync(long id, UpdateRoleRequest request, CancellationToken cancellationToken = default);
    Task DeleteRoleAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<PermissionDto>> GetPermissionsAsync(PaginationQuery query, CancellationToken cancellationToken = default);
    Task<PermissionMatrixDto> GetPermissionMatrixAsync(CancellationToken cancellationToken = default);
    Task<PermissionDto> UpdatePermissionAsync(long id, UpdatePermissionRequest request, CancellationToken cancellationToken = default);
    Task<RolePermissionMatrixDto> GetRolePermissionsAsync(long roleId, CancellationToken cancellationToken = default);
    Task<RolePermissionMatrixDto> UpdateRolePermissionsAsync(long roleId, IReadOnlyList<long> permissionIds, CancellationToken cancellationToken = default);

    Task<PagedResult<SystemSettingDto>> GetSettingsAsync(PaginationQuery query, CancellationToken cancellationToken = default);
    Task<SystemSettingDto> GetSettingByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SystemSettingDto>> GetSettingsByGroupAsync(string groupCode, CancellationToken cancellationToken = default);
    Task<SystemSettingDto> CreateSettingAsync(CreateSettingRequest request, CancellationToken cancellationToken = default);
    Task<SystemSettingDto> UpdateSettingByKeyAsync(string key, UpdateSettingRequest request, CancellationToken cancellationToken = default);
    Task<SystemSettingDto> UpdateSettingAsync(long id, UpdateSettingRequest request, CancellationToken cancellationToken = default);
    Task DeleteSettingAsync(long id, CancellationToken cancellationToken = default);
}

public interface IAccountPreferenceService
{
    Task<AccountPreferenceDto> GetAsync(CancellationToken cancellationToken = default);
    Task<AccountPreferenceDto> UpdateAsync(UpdatePreferenceRequest request, CancellationToken cancellationToken = default);
}
