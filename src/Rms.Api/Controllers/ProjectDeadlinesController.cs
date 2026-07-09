using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/project-deadlines")]
public sealed class ProjectDeadlinesController : ApiControllerBase
{
    private readonly IResearchService _service;
    public ProjectDeadlinesController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ProjectDeadlineView)]
    public async Task<IActionResult> List([FromQuery] ProjectDeadlineQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetDeadlinesAsync(query, cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.ProjectDeadlineView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetDeadlineAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.ProjectDeadlineCreate)]
    public async Task<IActionResult> Create(CreateProjectDeadlineRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateDeadlineAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.ProjectDeadlineUpdate)]
    public async Task<IActionResult> Update(long id, UpdateProjectDeadlineRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateDeadlineAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.ProjectDeadlineDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteDeadlineAsync(id, cancellationToken);
        return NoDataResponse();
    }

    [HttpPut("{id:long}/mark-completed"), RequirePermission(PermissionCodes.ProjectDeadlineUpdate)]
    public async Task<IActionResult> MarkCompleted(long id, CancellationToken cancellationToken) => OkResponse(await _service.MarkDeadlineCompletedAsync(id, cancellationToken));
}
