using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Common;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/project-documents")]
public sealed class ProjectDocumentsController : ApiControllerBase
{
    private readonly IResearchService _service;
    public ProjectDocumentsController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> List([FromQuery] PaginationQuery query, [FromQuery] long? projectId, CancellationToken cancellationToken) => OkResponse(await _service.GetDocumentsAsync(query, projectId, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Create(CreateProjectDocumentRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateDocumentAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Update(long id, UpdateProjectDocumentRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateDocumentAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.ResearchProjectUpdate)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteDocumentAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
