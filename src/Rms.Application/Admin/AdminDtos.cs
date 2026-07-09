using System.ComponentModel.DataAnnotations;
using Rms.Application.Common;

namespace Rms.Application.Admin;

public sealed class UserListQuery : PaginationQuery
{
    public string? AccountStatus { get; set; }
    public string? Status
    {
        get => AccountStatus;
        set => AccountStatus = value;
    }

    public long? DepartmentId { get; set; }
    public long? RoleId { get; set; }
    public string? Title { get; set; }
}

public sealed record UserDto(
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
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    IReadOnlyList<RoleDto> Roles);

public sealed record RoleDto(
    long RoleId,
    string RoleCode,
    string RoleName,
    string? Description,
    bool IsSystem,
    bool IsActive,
    int UserCount,
    DateTime CreatedAt);

public sealed record PermissionDto(
    long PermissionId,
    string ModuleCode,
    string ModuleName,
    string ActionCode,
    string ActionName,
    string PermissionCode,
    string? Description,
    bool IsActive);

public sealed record SystemSettingDto(
    long SettingId,
    string SettingKey,
    string? SettingValue,
    string ValueType,
    string SettingGroup,
    string SettingName,
    string? Description,
    bool IsPublic,
    bool IsActive);

public sealed record AccountPreferenceDto(
    string AppearanceMode,
    string LanguageCode,
    bool EnableInAppNotification,
    bool EnableEmailNotification,
    bool ReceiveDeadlineNotification,
    bool ReceiveTrainingNotification,
    bool ReceiveEthicsNotification,
    bool AutoMarkReadOnOpen);

public sealed record PermissionMatrixDto(IReadOnlyList<PermissionModuleDto> Modules);

public sealed record PermissionModuleDto(string ModuleCode, string ModuleName, IReadOnlyList<PermissionDto> Permissions);

public sealed record RolePermissionMatrixDto(long RoleId, string RoleName, IReadOnlyList<RolePermissionModuleDto> Modules);

public sealed record RolePermissionModuleDto(string ModuleCode, string ModuleName, IReadOnlyList<RolePermissionActionDto> Actions);

public sealed record RolePermissionActionDto(
    string ActionCode,
    string ActionName,
    string PermissionCode,
    long PermissionId,
    bool IsAllowed);

public sealed record CreateUserRequest(
    [Required, MinLength(3)] string Username,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FullName,
    string? Initials,
    string? PhoneNumber,
    string? AvatarUrl,
    string? Title,
    long? DepartmentId,
    bool IsSystemAdmin,
    bool MustChangePassword,
    IReadOnlyList<long>? RoleIds);

public sealed record UpdateUserRequest(
    [Required, EmailAddress] string Email,
    [Required] string FullName,
    string? Initials,
    string? PhoneNumber,
    string? AvatarUrl,
    string? Title,
    long? DepartmentId,
    string AccountStatus,
    bool IsSystemAdmin,
    bool MustChangePassword,
    IReadOnlyList<long>? RoleIds);

public sealed record ResetPasswordRequest(string? NewPassword, bool MustChangePassword = true);

public sealed record CreateRoleRequest(
    [Required] string RoleCode,
    [Required] string RoleName,
    string? Description,
    bool IsActive,
    IReadOnlyList<long>? PermissionIds);

public sealed record UpdateRoleRequest(
    [Required] string RoleName,
    string? Description,
    bool IsActive,
    IReadOnlyList<long>? PermissionIds);

public sealed record UpdateRolePermissionsRequest(IReadOnlyList<long> PermissionIds);

public sealed record UpdatePermissionRequest(string? ModuleName, string? ActionName, string? Description, bool IsActive);

public sealed record CreateSettingRequest(
    [Required] string SettingKey,
    string? SettingValue,
    [Required] string ValueType,
    [Required] string SettingGroup,
    [Required] string SettingName,
    string? Description,
    bool IsPublic,
    bool IsActive);

public sealed record UpdateSettingRequest(
    string? SettingValue,
    [Required] string ValueType,
    [Required] string SettingGroup,
    [Required] string SettingName,
    string? Description,
    bool IsPublic,
    bool IsActive);

public sealed record UpdatePreferenceRequest(
    [Required] string AppearanceMode,
    [Required] string LanguageCode,
    bool EnableInAppNotification,
    bool EnableEmailNotification,
    bool ReceiveDeadlineNotification,
    bool ReceiveTrainingNotification,
    bool ReceiveEthicsNotification,
    bool AutoMarkReadOnOpen);
