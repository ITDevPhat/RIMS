using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class AuditService : IAuditService
{
    private readonly RmsDbContext _dbContext;
    private readonly IUserContext _userContext;

    public AuditService(RmsDbContext dbContext, IUserContext userContext)
    {
        _dbContext = dbContext;
        _userContext = userContext;
    }

    public async Task WriteActivityAsync(
        string moduleCode,
        string actionType,
        string actionSummary,
        string? entityType = null,
        long? entityId = null,
        string? entityCode = null,
        string? oldValueJson = null,
        string? newValueJson = null,
        CancellationToken cancellationToken = default)
    {
        _dbContext.ActivityLogs.Add(new ActivityLog
        {
            UserId = _userContext.User?.UserId,
            ModuleCode = moduleCode,
            ActionType = actionType,
            EntityType = entityType,
            EntityId = entityId,
            EntityCode = entityCode,
            ActionSummary = actionSummary,
            OldValueJson = oldValueJson,
            NewValueJson = newValueJson,
            IpAddress = _userContext.IpAddress,
            UserAgent = _userContext.UserAgent,
            RequestId = _userContext.RequestId,
            Status = "success",
            OccurredAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task WriteLoginEventAsync(
        long? userId,
        string? usernameOrEmail,
        string eventType,
        bool success,
        string? failureReason = null,
        CancellationToken cancellationToken = default)
    {
        _dbContext.LoginEvents.Add(new LoginEvent
        {
            UserId = userId,
            UsernameOrEmail = usernameOrEmail,
            EventType = eventType,
            Success = success,
            FailureReason = failureReason,
            IpAddress = _userContext.IpAddress,
            UserAgent = _userContext.UserAgent,
            OccurredAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
