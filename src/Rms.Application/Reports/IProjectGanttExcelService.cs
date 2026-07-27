namespace Rms.Application.Reports;

public interface IProjectGanttExcelService
{
    Task<ExportedFile> ExportProjectGanttAsync(
        long projectId,
        ProjectTimelineExportOptions options,
        CancellationToken cancellationToken = default);
}
