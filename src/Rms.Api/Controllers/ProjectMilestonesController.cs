using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/project-milestones")]
public sealed class ProjectMilestonesController : ApiControllerBase
{
    private readonly IResearchService _service;
    public ProjectMilestonesController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ProjectMilestoneView)]
    public async Task<IActionResult> List([FromQuery] ProjectMilestoneQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetMilestonesAsync(query, cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.ProjectMilestoneView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetMilestoneAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.ProjectMilestoneCreate)]
    public async Task<IActionResult> Create(CreateProjectMilestoneRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateMilestoneAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.ProjectMilestoneUpdate)]
    public async Task<IActionResult> Update(long id, UpdateProjectMilestoneRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateMilestoneAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.ProjectMilestoneDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteMilestoneAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
