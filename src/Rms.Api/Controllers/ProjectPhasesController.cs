using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/project-phases")]
public sealed class ProjectPhasesController : ApiControllerBase
{
    private readonly IResearchService _service;
    public ProjectPhasesController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ProjectPhaseView)]
    public async Task<IActionResult> List([FromQuery] ProjectPhaseQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetPhasesAsync(query, cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.ProjectPhaseView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetPhaseAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.ProjectPhaseCreate)]
    public async Task<IActionResult> Create(CreateProjectPhaseRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreatePhaseAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.ProjectPhaseUpdate)]
    public async Task<IActionResult> Update(long id, UpdateProjectPhaseRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdatePhaseAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.ProjectPhaseDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeletePhaseAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
