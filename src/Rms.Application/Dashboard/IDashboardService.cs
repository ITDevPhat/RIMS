using Rms.Application.Common;

namespace Rms.Application.Dashboard;

public interface IDashboardService
{
    Task<ResearchOverviewDto> GetResearchOverviewAsync(int year, CancellationToken cancellationToken = default);
    Task<TrainingOverviewDto> GetTrainingOverviewAsync(int year, CancellationToken cancellationToken = default);
    Task<DashboardDeadlinesDto> GetDeadlinesAsync(int days, CancellationToken cancellationToken = default);
}

public interface IAuditQueryService
{
    Task<PagedResult<ActivityLogDto>> GetActivityLogsAsync(AuditLogQuery query, CancellationToken cancellationToken = default);
    Task<ActivityLogDto> GetActivityLogAsync(long id, CancellationToken cancellationToken = default);
    Task<PagedResult<LoginEventDto>> GetLoginEventsAsync(LoginEventQuery query, CancellationToken cancellationToken = default);
    Task<LoginEventDto> GetLoginEventAsync(long id, CancellationToken cancellationToken = default);
}
