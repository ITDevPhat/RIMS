using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Common;
using Rms.Application.Reports;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/reports")]
public sealed class ReportsController : ApiControllerBase
{
    private readonly IProjectGanttExcelService _projectGanttExcelService;

    public ReportsController(IProjectGanttExcelService projectGanttExcelService)
    {
        _projectGanttExcelService = projectGanttExcelService;
    }

    [HttpGet("projects/{projectId:long}/gantt.xlsx")]
    [RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> ExportProjectGantt(
        long projectId,
        [FromQuery] ProjectGanttExportQuery query,
        CancellationToken cancellationToken)
    {
        if (projectId <= 0)
        {
            return BadRequest(ApiResponse.Fail("Invalid project ID."));
        }

        var exportedFile = await _projectGanttExcelService.ExportProjectGanttAsync(
            projectId,
            query.ToOptions(),
            cancellationToken);

        return File(exportedFile.Content, exportedFile.ContentType, exportedFile.FileName);
    }
}

public sealed class ProjectGanttExportQuery
{
    public DateOnly? FromDate { get; init; }

    public DateOnly? ToDate { get; init; }

    public bool IncludeActual { get; init; } = true;

    public bool IncludeMilestones { get; init; } = true;

    public bool IncludeDeadlines { get; init; } = true;

    public string? TimeScale { get; init; } = "auto";

    public ProjectTimelineExportOptions ToOptions()
    {
        return new ProjectTimelineExportOptions
        {
            FromDate = FromDate,
            ToDate = ToDate,
            IncludeActual = IncludeActual,
            IncludeMilestones = IncludeMilestones,
            IncludeDeadlines = IncludeDeadlines,
            TimeScale = ParseTimeScale(TimeScale)
        };
    }

    private static ProjectTimelineTimeScale ParseTimeScale(string? value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "day" => ProjectTimelineTimeScale.Day,
            "week" => ProjectTimelineTimeScale.Week,
            "month" => ProjectTimelineTimeScale.Month,
            _ => ProjectTimelineTimeScale.Auto
        };
    }
}
