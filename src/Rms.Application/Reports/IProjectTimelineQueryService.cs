namespace Rms.Application.Reports;

public interface IProjectTimelineQueryService
{
    Task<ProjectTimelineDto> GetProjectTimelineAsync(
        long projectId,
        ProjectTimelineExportOptions options,
        CancellationToken cancellationToken = default);
}
