using Rms.Application.Common;

namespace Rms.Application.Dashboard;

public sealed record DashboardBucketDto(string Key, string Label, int Count);

public sealed record DashboardPhaseDto(
    long PhaseId,
    string PhaseName,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    decimal ProgressPercent,
    string PhaseStatus);

public sealed record DashboardGanttProjectDto(
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    string? DepartmentName,
    string? PrincipalInvestigatorName,
    string? SponsorName,
    decimal ProgressPercent,
    string HealthStatus,
    IReadOnlyList<DashboardPhaseDto> Phases);

public sealed record DashboardDeadlineDto(
    long DeadlineId,
    string DeadlineType,
    string Title,
    DateOnly DueDate,
    string PriorityLevel,
    string DeadlineStatus,
    long? ProjectId,
    string? ProjectCode,
    string? ProjectTitle,
    long? ResponsibleUserId,
    string? ResponsibleUserName,
    int DaysRemaining,
    bool IsOverdue);

public sealed record DashboardProjectAttentionDto(
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    string ProjectStatus,
    string HealthStatus,
    string RiskLevel,
    decimal ProgressPercent,
    DateOnly? PlannedEndDate,
    DateOnly? EthicsExpiryDate,
    IReadOnlyList<string> Reasons);

public sealed record DashboardEthicsDto(
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    DateOnly EthicsExpiryDate,
    long? PrincipalInvestigatorId,
    string? PrincipalInvestigatorName,
    int DaysRemaining);

public sealed record DashboardTrainingEventDto(
    long EventId,
    string EventCode,
    string EventTitle,
    DateOnly? PlannedDate,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    string PlanType,
    string EventStatus,
    long? DepartmentId,
    string? DepartmentName);

public sealed record ResearchOverviewDto(
    int TotalProjects,
    int ActiveProjects,
    int DueSoonCount,
    int OverdueCount,
    decimal AverageProgress,
    int EthicsExpiringCount,
    IReadOnlyList<DashboardBucketDto> ProjectHealthSummary,
    IReadOnlyList<DashboardDeadlineDto> UpcomingDeadlines,
    IReadOnlyList<DashboardProjectAttentionDto> ProjectsNeedAttention,
    IReadOnlyList<DashboardGanttProjectDto> GanttProjects);

public sealed record TrainingOverviewDto(
    int TotalPlannedEvents,
    int TotalAdditionalEvents,
    int TotalActualEvents,
    int TotalNotCompletedEvents,
    decimal CompletionRate,
    int CurrentMonthEvents,
    IReadOnlyList<TrainingDashboardMonthlySummaryDto> MonthlySummary,
    IReadOnlyList<DashboardBucketDto> StatusDistribution);

public sealed record TrainingDashboardMonthlySummaryDto(
    int Month,
    string MonthName,
    int PlannedCount,
    int AdditionalCount,
    int TotalPlan,
    int ActualCount,
    int NotCompletedCount,
    decimal CompletionRate);

public sealed record DashboardDeadlinesDto(
    IReadOnlyList<DashboardDeadlineDto> UpcomingIn7Days,
    IReadOnlyList<DashboardDeadlineDto> UpcomingIn30Days,
    IReadOnlyList<DashboardDeadlineDto> Overdue,
    IReadOnlyList<DashboardEthicsDto> EthicsExpiring,
    IReadOnlyList<DashboardTrainingEventDto> TrainingEventsUpcoming);

public sealed class AuditLogQuery : PaginationQuery
{
    public long? UserId { get; set; }
    public string? ModuleCode { get; set; }
    public string? ActionType { get; set; }
    public string? EntityType { get; set; }
    public long? EntityId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public sealed record ActivityLogDto(
    long ActivityLogId,
    DateTime PerformedAt,
    long? PerformedBy,
    string? PerformedByName,
    string ModuleCode,
    string ActionType,
    string? EntityType,
    long? EntityId,
    string ActionSummary,
    string? IpAddress,
    string? UserAgent,
    bool Success);

public sealed class LoginEventQuery : PaginationQuery
{
    public long? UserId { get; set; }
    public string? UsernameOrEmail { get; set; }
    public string? EventType { get; set; }
    public bool? Success { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public sealed record LoginEventDto(
    long LoginEventId,
    long? UserId,
    string? UsernameOrEmail,
    string EventType,
    bool Success,
    string? FailureReason,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt);
