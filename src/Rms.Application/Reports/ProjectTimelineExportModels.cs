namespace Rms.Application.Reports;

public sealed record ExportedFile(
    string FileName,
    string ContentType,
    byte[] Content);

public sealed class ProjectTimelineExportOptions
{
    public DateOnly? FromDate { get; init; }

    public DateOnly? ToDate { get; init; }

    public bool IncludeActual { get; init; } = true;

    public bool IncludeMilestones { get; init; } = true;

    public bool IncludeDeadlines { get; init; } = true;

    public ProjectTimelineTimeScale TimeScale { get; init; } = ProjectTimelineTimeScale.Auto;
}

public enum ProjectTimelineTimeScale
{
    Auto,
    Day,
    Week,
    Month
}

public enum ProjectTimelineRowType
{
    Project,
    Phase,
    Milestone,
    Deadline
}

public sealed record ProjectTimelineDto(
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    string? ProjectLeadName,
    string? DepartmentName,
    string? SponsorName,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    decimal ProgressPercent,
    string Status,
    string RiskLevel,
    string HealthStatus,
    DateTime GeneratedAt,
    ProjectTimelineTimeScale SelectedTimeScale,
    DateOnly TimelineStart,
    DateOnly TimelineEnd,
    IReadOnlyList<ProjectTimelineRowDto> Rows);

public sealed record ProjectTimelineRowDto(
    string Id,
    string? ParentId,
    ProjectTimelineRowType RowType,
    string Wbs,
    string Name,
    string? LeadName,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    decimal ProgressPercent,
    int WorkingDays,
    int HierarchyLevel,
    int SortOrder,
    bool IsGroup,
    string Status,
    string RiskLevel,
    bool IsOverdue,
    bool IsMilestone,
    bool IsDeadline);

public sealed record ProjectTimelinePeriod(
    DateOnly Start,
    DateOnly End,
    string Header,
    string SubHeader,
    bool IsWeekend);
