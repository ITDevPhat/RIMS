using Microsoft.EntityFrameworkCore;
using Rms.Application.Common;
using Rms.Application.Dashboard;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class DashboardService : IDashboardService, IAuditQueryService
{
    private readonly RmsDbContext _dbContext;

    public DashboardService(RmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ResearchOverviewDto> GetResearchOverviewAsync(int year, CancellationToken cancellationToken = default)
    {
        var selectedYear = NormalizeYear(year);
        var yearStart = new DateOnly(selectedYear, 1, 1);
        var yearEnd = new DateOnly(selectedYear, 12, 31);
        var createdStart = new DateTime(selectedYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var createdEnd = createdStart.AddYears(1);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dueSoonEnd = today.AddDays(7);
        var ethicsEnd = today.AddDays(30);

        var projects = await ProjectGraph()
            .Where(x => x.DeletedAt == null
                && (
                    (
                        (x.PlannedStartDate != null || x.PlannedEndDate != null)
                        && (x.PlannedStartDate ?? x.PlannedEndDate) <= yearEnd
                        && (x.PlannedEndDate ?? x.PlannedStartDate) >= yearStart
                    )
                    || x.ProjectPhases.Any(p => p.DeletedAt == null
                        && (p.PlannedStartDate != null || p.PlannedEndDate != null)
                        && (p.PlannedStartDate ?? p.PlannedEndDate) <= yearEnd
                        && (p.PlannedEndDate ?? p.PlannedStartDate) >= yearStart)
                    || (x.PlannedStartDate == null && x.PlannedEndDate == null && x.CreatedAt >= createdStart && x.CreatedAt < createdEnd)
                ))
            .ToListAsync(cancellationToken);

        var projectIds = projects.Select(x => x.ProjectId).ToList();
        var deadlines = await DeadlineGraph()
            .Where(x => x.DeletedAt == null && x.ProjectId != null && projectIds.Contains(x.ProjectId.Value))
            .ToListAsync(cancellationToken);

        var activeProjects = projects.Count(x => IsActiveProjectStatus(x.ProjectStatus));
        var averageProgress = projects.Count == 0 ? 0 : Math.Round(projects.Average(x => x.ProgressPercent), 2);
        var dueSoon = deadlines
            .Where(x => !IsCompleted(x.DeadlineStatus) && x.DueDate >= today && x.DueDate <= dueSoonEnd)
            .OrderBy(x => x.DueDate)
            .Take(10)
            .Select(x => MapDeadline(x, today))
            .ToList();
        var overdueCount = deadlines.Count(x => !IsCompleted(x.DeadlineStatus) && x.DueDate < today);
        var ethicsExpiringCount = projects.Count(x => x.EthicsExpiryDate is not null && x.EthicsExpiryDate >= today && x.EthicsExpiryDate <= ethicsEnd);
        var healthSummary = projects
            .GroupBy(x => string.IsNullOrWhiteSpace(x.HealthStatus) ? "unknown" : x.HealthStatus)
            .Select(x => new DashboardBucketDto(x.Key, x.Key, x.Count()))
            .OrderBy(x => x.Key)
            .ToList();
        var attention = projects
            .Select(x => MapAttentionProject(x, deadlines.Where(d => d.ProjectId == x.ProjectId), today, ethicsEnd))
            .Where(x => x.Reasons.Count > 0)
            .OrderByDescending(x => x.Reasons.Count)
            .ThenBy(x => x.PlannedEndDate ?? DateOnly.MaxValue)
            .Take(10)
            .ToList();
        var ganttProjects = projects
            .OrderByDescending(x => x.ProjectPhases.Any(p => p.DeletedAt == null))
            .ThenBy(x => x.PlannedStartDate ?? DateOnly.MaxValue)
            .Take(50)
            .Select(MapGanttProject)
            .ToList();

        return new ResearchOverviewDto(
            projects.Count,
            activeProjects,
            dueSoon.Count,
            overdueCount,
            averageProgress,
            ethicsExpiringCount,
            healthSummary,
            dueSoon,
            attention,
            ganttProjects);
    }

    public async Task<TrainingOverviewDto> GetTrainingOverviewAsync(int year, CancellationToken cancellationToken = default)
    {
        var selectedYear = NormalizeYear(year);
        var now = DateTime.UtcNow;
        var events = await TrainingGraph()
            .Where(x => x.DeletedAt == null && x.IsActive && x.EventYear == selectedYear)
            .ToListAsync(cancellationToken);

        var totalPlanned = events.Count(x => x.PlanType == "planned" || x.PlanType == "dự kiến");
        var totalAdditional = events.Count(x => x.PlanType == "additional" || x.PlanType == "phát sinh");
        var totalActual = events.Count(x => IsCompleted(x.EventStatus) || x.EventStatus == "đã thực hiện");
        var totalPlan = totalPlanned + totalAdditional;
        var totalNotCompleted = Math.Max(totalPlan - totalActual, 0);
        var completionRate = totalPlan == 0 ? 0 : Math.Round(totalActual / (decimal)totalPlan * 100, 2);
        var currentMonthEvents = events.Count(x => x.EventYear == now.Year && x.EventMonth == now.Month);
        var monthly = BuildTrainingMonthlySummary(selectedYear, events);
        var status = events
            .GroupBy(x => string.IsNullOrWhiteSpace(x.EventStatus) ? "unknown" : x.EventStatus)
            .Select(x => new DashboardBucketDto(x.Key, x.Key, x.Count()))
            .OrderBy(x => x.Key)
            .ToList();

        return new TrainingOverviewDto(totalPlanned, totalAdditional, totalActual, totalNotCompleted, completionRate, currentMonthEvents, monthly, status);
    }

    public async Task<DashboardDeadlinesDto> GetDeadlinesAsync(int days, CancellationToken cancellationToken = default)
    {
        var normalizedDays = days <= 0 ? 30 : Math.Min(days, 365);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sevenDays = today.AddDays(7);
        var targetDate = today.AddDays(normalizedDays);

        var deadlines = await DeadlineGraph()
            .Where(x => x.DeletedAt == null)
            .ToListAsync(cancellationToken);
        var projects = await ProjectGraph()
            .Where(x => x.DeletedAt == null)
            .ToListAsync(cancellationToken);
        var trainingEvents = await TrainingGraph()
            .Where(x => x.DeletedAt == null && x.IsActive && x.PlannedDate >= today && x.PlannedDate <= targetDate)
            .OrderBy(x => x.PlannedDate)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);

        var upcoming7 = deadlines
            .Where(x => !IsCompleted(x.DeadlineStatus) && x.DueDate >= today && x.DueDate <= sevenDays)
            .OrderBy(x => x.DueDate)
            .Select(x => MapDeadline(x, today))
            .ToList();
        var upcoming30 = deadlines
            .Where(x => !IsCompleted(x.DeadlineStatus) && x.DueDate >= today && x.DueDate <= targetDate)
            .OrderBy(x => x.DueDate)
            .Select(x => MapDeadline(x, today))
            .ToList();
        var overdue = deadlines
            .Where(x => !IsCompleted(x.DeadlineStatus) && x.DueDate < today)
            .OrderBy(x => x.DueDate)
            .Select(x => MapDeadline(x, today))
            .ToList();
        var ethicsExpiring = projects
            .Where(x => x.EthicsExpiryDate is not null && x.EthicsExpiryDate >= today && x.EthicsExpiryDate <= targetDate)
            .OrderBy(x => x.EthicsExpiryDate)
            .Select(x => MapEthics(x, today))
            .ToList();

        return new DashboardDeadlinesDto(upcoming7, upcoming30, overdue, ethicsExpiring, trainingEvents.Select(MapTrainingEvent).ToList());
    }

    public async Task<PagedResult<ActivityLogDto>> GetActivityLogsAsync(AuditLogQuery query, CancellationToken cancellationToken = default)
    {
        var logs = _dbContext.ActivityLogs.Include(x => x.User).AsQueryable();
        if (query.UserId is not null) logs = logs.Where(x => x.UserId == query.UserId);
        if (!string.IsNullOrWhiteSpace(query.ModuleCode)) logs = logs.Where(x => x.ModuleCode == query.ModuleCode);
        if (!string.IsNullOrWhiteSpace(query.ActionType)) logs = logs.Where(x => x.ActionType == query.ActionType);
        if (!string.IsNullOrWhiteSpace(query.EntityType)) logs = logs.Where(x => x.EntityType == query.EntityType);
        if (query.EntityId is not null) logs = logs.Where(x => x.EntityId == query.EntityId);
        if (query.FromDate is not null) logs = logs.Where(x => x.OccurredAt >= query.FromDate);
        if (query.ToDate is not null) logs = logs.Where(x => x.OccurredAt <= query.ToDate);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            logs = logs.Where(x => x.ActionSummary.Contains(query.Search) || x.ModuleCode.Contains(query.Search) || (x.EntityType != null && x.EntityType.Contains(query.Search)));
        }

        var total = await logs.CountAsync(cancellationToken);
        var items = await logs.OrderByDescending(x => x.OccurredAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        return PagedResult<ActivityLogDto>.Create(items.Select(MapActivityLog).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ActivityLogDto> GetActivityLogAsync(long id, CancellationToken cancellationToken = default)
    {
        var log = await _dbContext.ActivityLogs.Include(x => x.User).FirstOrDefaultAsync(x => x.ActivityLogId == id, cancellationToken);
        return log is null ? throw new NotFoundException("Activity log not found.") : MapActivityLog(log);
    }

    public async Task<PagedResult<LoginEventDto>> GetLoginEventsAsync(LoginEventQuery query, CancellationToken cancellationToken = default)
    {
        var events = _dbContext.LoginEvents.AsQueryable();
        if (query.UserId is not null) events = events.Where(x => x.UserId == query.UserId);
        if (!string.IsNullOrWhiteSpace(query.UsernameOrEmail)) events = events.Where(x => x.UsernameOrEmail != null && x.UsernameOrEmail.Contains(query.UsernameOrEmail));
        if (!string.IsNullOrWhiteSpace(query.EventType)) events = events.Where(x => x.EventType == query.EventType);
        if (query.Success is not null) events = events.Where(x => x.Success == query.Success);
        if (query.FromDate is not null) events = events.Where(x => x.OccurredAt >= query.FromDate);
        if (query.ToDate is not null) events = events.Where(x => x.OccurredAt <= query.ToDate);

        var total = await events.CountAsync(cancellationToken);
        var items = await events.OrderByDescending(x => x.OccurredAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        return PagedResult<LoginEventDto>.Create(items.Select(MapLoginEvent).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<LoginEventDto> GetLoginEventAsync(long id, CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.LoginEvents.FirstOrDefaultAsync(x => x.LoginEventId == id, cancellationToken);
        return item is null ? throw new NotFoundException("Login event not found.") : MapLoginEvent(item);
    }

    private IQueryable<ResearchProject> ProjectGraph() => _dbContext.ResearchProjects
        .Include(x => x.LeadDepartment)
        .Include(x => x.PrincipalInvestigator)
        .Include(x => x.Sponsor)
        .Include(x => x.ProjectPhases);

    private IQueryable<ProjectDeadline> DeadlineGraph() => _dbContext.ProjectDeadlines
        .Include(x => x.Project)
        .Include(x => x.ResponsibleUser);

    private IQueryable<TrainingEvent> TrainingGraph() => _dbContext.TrainingEvents
        .Include(x => x.Department);

    private static DashboardProjectAttentionDto MapAttentionProject(ResearchProject project, IEnumerable<ProjectDeadline> deadlines, DateOnly today, DateOnly ethicsEnd)
    {
        var reasons = new List<string>();
        if (deadlines.Any(x => !IsCompleted(x.DeadlineStatus) && x.DueDate < today)) reasons.Add("overdue_deadline");
        if (project.EthicsExpiryDate is not null && project.EthicsExpiryDate >= today && project.EthicsExpiryDate <= ethicsEnd) reasons.Add("ethics_expiring");
        if (IsActiveProjectStatus(project.ProjectStatus) && project.ProgressPercent < 50) reasons.Add("low_progress");
        if (project.RiskLevel is "high" or "critical") reasons.Add("high_risk");

        return new DashboardProjectAttentionDto(project.ProjectId, project.ProjectCode, project.ProjectTitle, project.ProjectStatus, project.HealthStatus, project.RiskLevel, project.ProgressPercent, project.PlannedEndDate, project.EthicsExpiryDate, reasons);
    }

    private static DashboardGanttProjectDto MapGanttProject(ResearchProject project) => new(
        project.ProjectId,
        project.ProjectCode,
        project.ProjectTitle,
        project.LeadDepartment?.DepartmentName,
        project.PrincipalInvestigator?.FullName,
        project.Sponsor?.SponsorName ?? project.SponsorNameText,
        project.ProgressPercent,
        project.HealthStatus,
        project.ProjectPhases
            .Where(x => x.DeletedAt == null)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.PlannedStartDate ?? DateOnly.MaxValue)
            .Select(x => new DashboardPhaseDto(x.PhaseId, x.PhaseName, x.PlannedStartDate, x.PlannedEndDate, x.ActualStartDate, x.ActualEndDate, x.ProgressPercent, x.PhaseStatus))
            .ToList());

    private static DashboardDeadlineDto MapDeadline(ProjectDeadline item, DateOnly today) => new(
        item.DeadlineId,
        item.DeadlineType,
        item.DeadlineTitle,
        item.DueDate,
        item.PriorityLevel,
        item.DeadlineStatus,
        item.ProjectId,
        item.Project?.ProjectCode,
        item.Project?.ProjectTitle,
        item.ResponsibleUserId,
        item.ResponsibleUser?.FullName,
        item.DueDate.DayNumber - today.DayNumber,
        item.DueDate < today && !IsCompleted(item.DeadlineStatus));

    private static DashboardEthicsDto MapEthics(ResearchProject project, DateOnly today) => new(
        project.ProjectId,
        project.ProjectCode,
        project.ProjectTitle,
        project.EthicsExpiryDate!.Value,
        project.PrincipalInvestigatorId,
        project.PrincipalInvestigator?.FullName,
        project.EthicsExpiryDate.Value.DayNumber - today.DayNumber);

    private static DashboardTrainingEventDto MapTrainingEvent(TrainingEvent item) => new(
        item.EventId,
        item.EventCode,
        item.EventTitle,
        item.PlannedDate,
        item.StartTime,
        item.EndTime,
        item.PlanType,
        item.EventStatus,
        item.DepartmentId,
        item.Department?.DepartmentName);

    private static IReadOnlyList<TrainingDashboardMonthlySummaryDto> BuildTrainingMonthlySummary(int year, IReadOnlyList<TrainingEvent> events)
    {
        return Enumerable.Range(1, 12).Select(month =>
        {
            var monthly = events.Where(x => x.EventYear == year && x.EventMonth == month).ToList();
            var planned = monthly.Count(x => x.PlanType == "planned" || x.PlanType == "dự kiến");
            var additional = monthly.Count(x => x.PlanType == "additional" || x.PlanType == "phát sinh");
            var actual = monthly.Count(x => IsCompleted(x.EventStatus) || x.EventStatus == "đã thực hiện");
            var total = planned + additional;
            var notCompleted = Math.Max(total - actual, 0);
            var rate = total == 0 ? 0 : Math.Round(actual / (decimal)total * 100, 2);
            return new TrainingDashboardMonthlySummaryDto(month, $"Tháng {month}", planned, additional, total, actual, notCompleted, rate);
        }).ToList();
    }

    private static ActivityLogDto MapActivityLog(ActivityLog item) => new(
        item.ActivityLogId,
        item.OccurredAt,
        item.UserId,
        item.User?.FullName,
        item.ModuleCode,
        item.ActionType,
        item.EntityType,
        item.EntityId,
        item.ActionSummary,
        item.IpAddress,
        item.UserAgent,
        item.Status == "success");

    private static LoginEventDto MapLoginEvent(LoginEvent item) => new(item.LoginEventId, item.UserId, item.UsernameOrEmail, item.EventType, item.Success, item.FailureReason, item.IpAddress, item.UserAgent, item.OccurredAt);
    private static int NormalizeYear(int year) => year <= 0 ? DateTime.UtcNow.Year : year;
    private static bool IsCompleted(string status) => status is "completed" or "done" or "closed";
    private static bool IsActiveProjectStatus(string status) => status is "active" or "in_progress" or "đang thực hiện";
}
