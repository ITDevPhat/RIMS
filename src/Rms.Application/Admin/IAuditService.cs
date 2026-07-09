namespace Rms.Application.Admin;

public interface IAuditService
{
    Task WriteActivityAsync(
        string moduleCode,
        string actionType,
        string actionSummary,
        string? entityType = null,
        long? entityId = null,
        string? entityCode = null,
        string? oldValueJson = null,
        string? newValueJson = null,
        CancellationToken cancellationToken = default);

    Task WriteLoginEventAsync(
        long? userId,
        string? usernameOrEmail,
        string eventType,
        bool success,
        string? failureReason = null,
        CancellationToken cancellationToken = default);
}
