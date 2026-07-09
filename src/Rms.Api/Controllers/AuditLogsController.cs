using Microsoft.AspNetCore.Mvc;
using Rms.Application.Dashboard;

namespace Rms.Api.Controllers;

[Route("api/audit-logs")]
public sealed class AuditLogsController : ApiControllerBase
{
    private readonly IAuditQueryService _service;
    public AuditLogsController(IAuditQueryService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] AuditLogQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetActivityLogsAsync(query, cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetActivityLogAsync(id, cancellationToken));
}
