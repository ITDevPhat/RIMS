using Microsoft.EntityFrameworkCore;
using Rms.Application.Common;
using Rms.Application.Reports;
using Rms.Infrastructure.Persistence;

namespace Rms.Infrastructure.Services;

public sealed class ProjectTimelineQueryService : IProjectTimelineQueryService
{
    private readonly RmsDbContext _dbContext;

    public ProjectTimelineQueryService(RmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ProjectTimelineDto> GetProjectTimelineAsync(
        long projectId,
        ProjectTimelineExportOptions options,
        CancellationToken cancellationToken = default)
    {
        var project = await _dbContext.ResearchProjects
            .AsNoTracking()
            .Where(x => x.ProjectId == projectId && x.DeletedAt == null)
            .Select(x => new ProjectProjection(
                x.ProjectId,
                x.ProjectCode,
                x.ProjectTitle,
                x.PrincipalInvestigatorName ?? (x.PrincipalInvestigator != null ? x.PrincipalInvestigator.FullName : null),
                x.LeadDepartment != null ? x.LeadDepartment.DepartmentName : null,
                x.Sponsor != null ? x.Sponsor.SponsorName : x.SponsorNameText,
                x.PlannedStartDate,
                x.PlannedEndDate,
                x.ActualStartDate,
                x.ActualEndDate,
                x.ProgressPercent,
                x.ProjectStatus,
                x.RiskLevel,
                x.HealthStatus))
            .FirstOrDefaultAsync(cancellationToken);

        if (project is null)
        {
            throw new NotFoundException("Research project not found.");
        }

        var today = DateOnly.FromDateTime(DateTime.Today);
        var rows = new List<ProjectTimelineRowDto>
        {
            new(
                $"project:{project.ProjectId}",
                null,
                ProjectTimelineRowType.Project,
                "1",
                project.ProjectTitle,
                project.ProjectLeadName,
                project.PlannedStartDate,
                project.PlannedEndDate,
                project.ActualStartDate,
                project.ActualEndDate,
                project.ProgressPercent,
                ProjectTimelineExportLogic.CalculateWorkingDays(project.PlannedStartDate, project.PlannedEndDate),
                0,
                0,
                true,
                project.Status,
                project.RiskLevel,
                IsOverdue(project.PlannedEndDate, project.ProgressPercent, project.Status, today),
                false,
                false)
        };

        var phases = await _dbContext.ProjectPhases
            .AsNoTracking()
            .Where(x => x.ProjectId == projectId && x.DeletedAt == null && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.PlannedStartDate)
            .ThenBy(x => x.PhaseId)
            .Select(x => new PhaseProjection(
                x.PhaseId,
                x.PhaseName,
                x.OwnerUser != null ? x.OwnerUser.FullName : null,
                x.PlannedStartDate,
                x.PlannedEndDate,
                x.DeadlineDate,
                x.ActualStartDate,
                x.ActualEndDate,
                x.ProgressPercent,
                x.PhaseStatus,
                x.SortOrder))
            .ToListAsync(cancellationToken);

        var phaseWbs = new Dictionary<long, string>();
        for (var index = 0; index < phases.Count; index++)
        {
            var phase = phases[index];
            var wbs = $"1.{index + 1}";
            phaseWbs[phase.PhaseId] = wbs;
            var plannedEnd = phase.PlannedEndDate ?? phase.DeadlineDate;
            rows.Add(new ProjectTimelineRowDto(
                $"phase:{phase.PhaseId}",
                $"project:{project.ProjectId}",
                ProjectTimelineRowType.Phase,
                wbs,
                phase.PhaseName,
                phase.LeadName,
                phase.PlannedStartDate,
                plannedEnd,
                phase.ActualStartDate,
                phase.ActualEndDate,
                phase.ProgressPercent,
                ProjectTimelineExportLogic.CalculateWorkingDays(phase.PlannedStartDate, plannedEnd),
                1,
                phase.SortOrder,
                true,
                phase.Status,
                project.RiskLevel,
                IsOverdue(plannedEnd, phase.ProgressPercent, phase.Status, today),
                false,
                false));
        }

        if (options.IncludeMilestones)
        {
            var milestones = await _dbContext.ProjectMilestones
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId && x.DeletedAt == null && x.IsActive)
                .OrderBy(x => x.PhaseId == null)
                .ThenBy(x => x.Phase != null ? x.Phase.SortOrder : int.MaxValue)
                .ThenBy(x => x.DueDate)
                .ThenBy(x => x.MilestoneId)
                .Select(x => new MilestoneProjection(
                    x.MilestoneId,
                    x.PhaseId,
                    x.MilestoneName,
                    x.OwnerUser != null ? x.OwnerUser.FullName : null,
                    x.DueDate,
                    x.CompletedDate,
                    x.MilestoneStatus,
                    x.PriorityLevel))
                .ToListAsync(cancellationToken);

            var globalMilestoneIndex = 1;
            var milestoneIndexByPhase = new Dictionary<long, int>();
            foreach (var milestone in milestones)
            {
                var hasPhase = false;
                var parentWbs = string.Empty;
                if (milestone.PhaseId.HasValue)
                {
                    hasPhase = phaseWbs.TryGetValue(milestone.PhaseId.Value, out parentWbs);
                }

                var wbs = hasPhase && milestone.PhaseId.HasValue
                    ? $"{parentWbs}.{NextIndex(milestoneIndexByPhase, milestone.PhaseId.Value)}"
                    : $"1.M{globalMilestoneIndex++}";
                rows.Add(new ProjectTimelineRowDto(
                    $"milestone:{milestone.MilestoneId}",
                    hasPhase ? $"phase:{milestone.PhaseId}" : $"project:{project.ProjectId}",
                    ProjectTimelineRowType.Milestone,
                    wbs,
                    milestone.Name,
                    milestone.LeadName,
                    milestone.DueDate,
                    milestone.DueDate,
                    milestone.CompletedDate,
                    milestone.CompletedDate,
                    string.Equals(milestone.Status, "completed", StringComparison.OrdinalIgnoreCase) ? 100m : 0m,
                    0,
                    hasPhase ? 2 : 1,
                    milestone.MilestoneId.GetHashCode(),
                    false,
                    milestone.Status,
                    milestone.PriorityLevel,
                    IsOverdue(milestone.DueDate, string.Equals(milestone.Status, "completed", StringComparison.OrdinalIgnoreCase) ? 100m : 0m, milestone.Status, today),
                    true,
                    false));
            }
        }

        if (options.IncludeDeadlines)
        {
            var deadlines = await _dbContext.ProjectDeadlines
                .AsNoTracking()
                .Where(x => x.DeletedAt == null
                    && (x.ProjectId == projectId
                        || (x.Phase != null && x.Phase.ProjectId == projectId)
                        || (x.Milestone != null && x.Milestone.ProjectId == projectId)))
                .OrderBy(x => x.Phase != null ? x.Phase.SortOrder : int.MaxValue)
                .ThenBy(x => x.DueDate)
                .ThenBy(x => x.DeadlineId)
                .Select(x => new DeadlineProjection(
                    x.DeadlineId,
                    x.ProjectId,
                    x.PhaseId,
                    x.MilestoneId,
                    x.DeadlineTitle,
                    x.ResponsibleUser != null ? x.ResponsibleUser.FullName : null,
                    x.DueDate,
                    x.CompletedAt,
                    x.DeadlineStatus,
                    x.PriorityLevel))
                .ToListAsync(cancellationToken);

            var deadlineIndex = 1;
            foreach (var deadline in deadlines)
            {
                var parentId = $"project:{project.ProjectId}";
                var level = 1;
                var wbs = $"1.D{deadlineIndex++}";
                if (deadline.PhaseId.HasValue && phaseWbs.TryGetValue(deadline.PhaseId.Value, out var phasePrefix))
                {
                    parentId = $"phase:{deadline.PhaseId}";
                    level = 2;
                    wbs = $"{phasePrefix}.D{deadlineIndex - 1}";
                }

                var completedDate = deadline.CompletedAt.HasValue
                    ? DateOnly.FromDateTime(deadline.CompletedAt.Value)
                    : (DateOnly?)null;
                var completedProgress = string.Equals(deadline.Status, "completed", StringComparison.OrdinalIgnoreCase) ? 100m : 0m;
                rows.Add(new ProjectTimelineRowDto(
                    $"deadline:{deadline.DeadlineId}",
                    parentId,
                    ProjectTimelineRowType.Deadline,
                    wbs,
                    deadline.Title,
                    deadline.LeadName,
                    deadline.DueDate,
                    deadline.DueDate,
                    completedDate,
                    completedDate,
                    completedProgress,
                    0,
                    level,
                    deadline.DeadlineId.GetHashCode(),
                    false,
                    deadline.Status,
                    deadline.PriorityLevel,
                    IsOverdue(deadline.DueDate, completedProgress, deadline.Status, today),
                    false,
                    true));
            }
        }

        var rangeDates = rows
            .SelectMany(x => new[] { x.PlannedStartDate, x.PlannedEndDate, options.IncludeActual ? x.ActualStartDate : null, options.IncludeActual ? x.ActualEndDate : null })
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .ToList();

        var fallbackStart = new DateOnly(today.Year, 1, 1);
        var fallbackEnd = new DateOnly(today.Year, 12, 31);
        var timelineStart = options.FromDate ?? (rangeDates.Count > 0 ? rangeDates.Min() : fallbackStart);
        var timelineEnd = options.ToDate ?? (rangeDates.Count > 0 ? rangeDates.Max() : fallbackEnd);
        if (timelineEnd < timelineStart)
        {
            timelineEnd = timelineStart;
        }

        var selectedScale = ProjectTimelineExportLogic.ResolveTimeScale(options.TimeScale, timelineStart, timelineEnd);

        return new ProjectTimelineDto(
            project.ProjectId,
            project.ProjectCode,
            project.ProjectTitle,
            project.ProjectLeadName,
            project.DepartmentName,
            project.SponsorName,
            project.PlannedStartDate,
            project.PlannedEndDate,
            project.ActualStartDate,
            project.ActualEndDate,
            project.ProgressPercent,
            project.Status,
            project.RiskLevel,
            project.HealthStatus,
            DateTime.Now,
            selectedScale,
            timelineStart,
            timelineEnd,
            rows.OrderBy(x => x.Wbs, StringComparer.OrdinalIgnoreCase).ToList());
    }

    private static bool IsOverdue(DateOnly? plannedEndDate, decimal progressPercent, string status, DateOnly today)
    {
        return plannedEndDate.HasValue
            && plannedEndDate.Value < today
            && progressPercent < 100m
            && ProjectTimelineExportLogic.IsIncompleteStatus(status);
    }

    private static int NextIndex(Dictionary<long, int> counters, long id)
    {
        counters.TryGetValue(id, out var current);
        counters[id] = current + 1;
        return current + 1;
    }

    private sealed record ProjectProjection(long ProjectId, string ProjectCode, string ProjectTitle, string? ProjectLeadName, string? DepartmentName, string? SponsorName, DateOnly? PlannedStartDate, DateOnly? PlannedEndDate, DateOnly? ActualStartDate, DateOnly? ActualEndDate, decimal ProgressPercent, string Status, string RiskLevel, string HealthStatus);
    private sealed record PhaseProjection(long PhaseId, string PhaseName, string? LeadName, DateOnly? PlannedStartDate, DateOnly? PlannedEndDate, DateOnly? DeadlineDate, DateOnly? ActualStartDate, DateOnly? ActualEndDate, decimal ProgressPercent, string Status, int SortOrder);
    private sealed record MilestoneProjection(long MilestoneId, long? PhaseId, string Name, string? LeadName, DateOnly DueDate, DateOnly? CompletedDate, string Status, string PriorityLevel);
    private sealed record DeadlineProjection(long DeadlineId, long? ProjectId, long? PhaseId, long? MilestoneId, string Title, string? LeadName, DateOnly DueDate, DateTime? CompletedAt, string Status, string PriorityLevel);
}
