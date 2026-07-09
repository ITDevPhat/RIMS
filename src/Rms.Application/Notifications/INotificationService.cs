using Rms.Application.Common;

namespace Rms.Application.Notifications;

public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetNotificationsAsync(NotificationQuery query, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(CancellationToken cancellationToken = default);
    Task<NotificationDto> GetNotificationAsync(long id, CancellationToken cancellationToken = default);
    Task MarkReadAsync(long id, CancellationToken cancellationToken = default);
    Task MarkUnreadAsync(long id, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(CancellationToken cancellationToken = default);
    Task DeleteNotificationAsync(long id, CancellationToken cancellationToken = default);
    Task<NotificationSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<NotificationSettingsDto> UpdateSettingsAsync(NotificationSettingsDto request, CancellationToken cancellationToken = default);
}

public interface INotificationRuleService
{
    Task<PagedResult<NotificationRuleDto>> GetRulesAsync(PaginationQuery query, CancellationToken cancellationToken = default);
    Task<NotificationRuleDto> GetRuleAsync(long id, CancellationToken cancellationToken = default);
    Task<NotificationRuleDto> CreateRuleAsync(NotificationRuleRequest request, CancellationToken cancellationToken = default);
    Task<NotificationRuleDto> UpdateRuleAsync(long id, NotificationRuleRequest request, CancellationToken cancellationToken = default);
    Task DeleteRuleAsync(long id, CancellationToken cancellationToken = default);
    Task<NotificationRuleDto> EnableRuleAsync(long id, CancellationToken cancellationToken = default);
    Task<NotificationRuleDto> DisableRuleAsync(long id, CancellationToken cancellationToken = default);
}

public interface INotificationScannerService
{
    Task<NotificationScanResultDto> ScanAsync(CancellationToken cancellationToken = default);
}
