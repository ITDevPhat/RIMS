using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/research-projects")]
public sealed class ResearchProjectsController : ApiControllerBase
{
    private readonly IResearchService _service;
    public ResearchProjectsController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> List([FromQuery] ResearchProjectQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetProjectsAsync(query, cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetProjectAsync(id, cancellationToken));

    [HttpGet("{id:long}/overview"), RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> Overview(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetProjectOverviewAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.ResearchProjectCreate)]
    public async Task<IActionResult> Create(CreateResearchProjectRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateProjectAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Update(long id, UpdateResearchProjectRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateProjectAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteProjectAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
