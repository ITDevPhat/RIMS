using Rms.Application.Common;

namespace Rms.Application.Research;

public interface IResearchService
{
    Task<PagedResult<ResearchProjectDto>> GetProjectsAsync(ResearchProjectQuery query, CancellationToken cancellationToken = default);
    Task<ResearchProjectDto> GetProjectAsync(long id, CancellationToken cancellationToken = default);
    Task<ResearchProjectOverviewDto> GetProjectOverviewAsync(long id, CancellationToken cancellationToken = default);
    Task<ResearchProjectDto> CreateProjectAsync(CreateResearchProjectRequest request, CancellationToken cancellationToken = default);
    Task<ResearchProjectDto> UpdateProjectAsync(long id, UpdateResearchProjectRequest request, CancellationToken cancellationToken = default);
    Task DeleteProjectAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectPhaseDto>> GetPhasesAsync(ProjectPhaseQuery query, CancellationToken cancellationToken = default);
    Task<ProjectPhaseDto> GetPhaseAsync(long id, CancellationToken cancellationToken = default);
    Task<ProjectPhaseDto> CreatePhaseAsync(CreateProjectPhaseRequest request, CancellationToken cancellationToken = default);
    Task<ProjectPhaseDto> UpdatePhaseAsync(long id, UpdateProjectPhaseRequest request, CancellationToken cancellationToken = default);
    Task DeletePhaseAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectMilestoneDto>> GetMilestonesAsync(ProjectMilestoneQuery query, CancellationToken cancellationToken = default);
    Task<ProjectMilestoneDto> GetMilestoneAsync(long id, CancellationToken cancellationToken = default);
    Task<ProjectMilestoneDto> CreateMilestoneAsync(CreateProjectMilestoneRequest request, CancellationToken cancellationToken = default);
    Task<ProjectMilestoneDto> UpdateMilestoneAsync(long id, UpdateProjectMilestoneRequest request, CancellationToken cancellationToken = default);
    Task DeleteMilestoneAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectDeadlineDto>> GetDeadlinesAsync(ProjectDeadlineQuery query, CancellationToken cancellationToken = default);
    Task<ProjectDeadlineDto> GetDeadlineAsync(long id, CancellationToken cancellationToken = default);
    Task<ProjectDeadlineDto> CreateDeadlineAsync(CreateProjectDeadlineRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDeadlineDto> UpdateDeadlineAsync(long id, UpdateProjectDeadlineRequest request, CancellationToken cancellationToken = default);
    Task DeleteDeadlineAsync(long id, CancellationToken cancellationToken = default);
    Task<ProjectDeadlineDto> MarkDeadlineCompletedAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<SponsorDto>> GetSponsorsAsync(PaginationQuery query, CancellationToken cancellationToken = default);
    Task<SponsorDto> CreateSponsorAsync(CreateSponsorRequest request, CancellationToken cancellationToken = default);
    Task<SponsorDto> UpdateSponsorAsync(long id, UpdateSponsorRequest request, CancellationToken cancellationToken = default);
    Task DeleteSponsorAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectMemberDto>> GetMembersAsync(PaginationQuery query, long? projectId = null, CancellationToken cancellationToken = default);
    Task<ProjectMemberDto> CreateMemberAsync(CreateProjectMemberRequest request, CancellationToken cancellationToken = default);
    Task<ProjectMemberDto> UpdateMemberAsync(long id, UpdateProjectMemberRequest request, CancellationToken cancellationToken = default);
    Task DeleteMemberAsync(long id, CancellationToken cancellationToken = default);

    Task<PagedResult<ProjectDocumentDto>> GetDocumentsAsync(PaginationQuery query, long? projectId = null, CancellationToken cancellationToken = default);
    Task<ProjectDocumentDto> CreateDocumentAsync(CreateProjectDocumentRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDocumentDto> UpdateDocumentAsync(long id, UpdateProjectDocumentRequest request, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(long id, CancellationToken cancellationToken = default);
}
