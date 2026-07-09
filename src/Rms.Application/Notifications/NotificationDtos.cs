using System.ComponentModel.DataAnnotations;
using Rms.Application.Common;

namespace Rms.Application.Notifications;

public sealed class NotificationQuery : PaginationQuery
{
    public bool? IsRead { get; set; }
    public string? Category { get; set; }
    public string? NotificationType { get; set; }
    public string? Priority { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public sealed record NotificationDto(
    long NotificationId,
    string Title,
    string Message,
    string NotificationType,
    string Category,
    string PriorityLevel,
    string? RelatedEntityType,
    long? RelatedEntityId,
    string? RelatedEntityCode,
    string? RelatedEntityName,
    DateTime CreatedAt,
    bool IsRead,
    DateTime? ReadAt,
    string? ActionUrl,
    string? ActionLabel);

public sealed record NotificationRuleDto(
    long RuleId,
    string RuleName,
    string TargetType,
    string ConditionType,
    int RemindBeforeDays,
    IReadOnlyList<string> Channels,
    string PriorityLevel,
    bool IsActive,
    string? Description);

public sealed record NotificationRuleRequest(
    string? RuleCode,
    [Required] string RuleName,
    [Required] string TargetType,
    [Required] string ConditionType,
    int RemindBeforeDays,
    IReadOnlyList<string>? Channels,
    string? PriorityLevel,
    long? TemplateId,
    bool RepeatIfOverdue,
    int? RepeatIntervalDays,
    bool IsActive,
    string? Description);

public sealed record NotificationSettingsDto(
    bool EnableSystemNotification,
    bool EnableEmailNotification,
    bool EnableInAppNotification,
    IReadOnlyList<int> DeadlineReminderDays,
    IReadOnlyList<int> TrainingEventReminderDays,
    IReadOnlyList<int> EthicsReminderDays,
    IReadOnlyList<int> ProjectEndingReminderDays,
    IReadOnlyList<int> ProgressReportReminderDays,
    bool OverdueRepeatEnabled,
    int OverdueRepeatDays,
    bool AutoMarkResolvedWhenCompleted,
    int ScannerRunHour);

public sealed record NotificationScanResultDto(int CreatedNotifications, int CreatedRecipients, IReadOnlyList<string> Messages);
