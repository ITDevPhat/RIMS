using System.ComponentModel.DataAnnotations;

namespace Rms.Application.Auth;

public sealed record LoginRequest(
    [Required] string UsernameOrEmail,
    [Required] string Password);

public sealed record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword,
    [Required] string ConfirmPassword);

public sealed record AuthPreferenceDto(
    string AppearanceMode,
    string LanguageCode,
    bool EnableInAppNotification,
    bool EnableEmailNotification,
    bool ReceiveDeadlineNotification,
    bool ReceiveTrainingNotification,
    bool ReceiveEthicsNotification,
    bool AutoMarkReadOnOpen);

public sealed record UserProfileDto(
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
    IReadOnlyList<RoleDto> Roles,
    IReadOnlyList<string> Permissions,
    AuthPreferenceDto? Preferences);

public sealed record RoleDto(long RoleId, string RoleCode, string RoleName);

public sealed record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    UserProfileDto User);
