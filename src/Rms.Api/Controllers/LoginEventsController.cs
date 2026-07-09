using Microsoft.AspNetCore.Mvc;
using Rms.Application.Dashboard;

namespace Rms.Api.Controllers;

[Route("api/login-events")]
public sealed class LoginEventsController : ApiControllerBase
{
    private readonly IAuditQueryService _service;
    public LoginEventsController(IAuditQueryService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] LoginEventQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetLoginEventsAsync(query, cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetLoginEventAsync(id, cancellationToken));
}
