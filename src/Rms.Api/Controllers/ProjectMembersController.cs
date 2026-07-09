using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Common;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/project-members")]
public sealed class ProjectMembersController : ApiControllerBase
{
    private readonly IResearchService _service;
    public ProjectMembersController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> List([FromQuery] PaginationQuery query, [FromQuery] long? projectId, CancellationToken cancellationToken) => OkResponse(await _service.GetMembersAsync(query, projectId, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Create(CreateProjectMemberRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateMemberAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Update(long id, UpdateProjectMemberRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateMemberAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteMemberAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
