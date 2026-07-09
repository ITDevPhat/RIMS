using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Common;
using Rms.Application.Notifications;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/notification-rules")]
public sealed class NotificationRulesController : ApiControllerBase
{
    private readonly INotificationRuleService _service;
    public NotificationRulesController(INotificationRuleService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> List([FromQuery] PaginationQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetRulesAsync(query, cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetRuleAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Create(NotificationRuleRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateRuleAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Update(long id, NotificationRuleRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateRuleAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteRuleAsync(id, cancellationToken);
        return NoDataResponse();
    }

    [HttpPut("{id:long}/enable"), RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Enable(long id, CancellationToken cancellationToken) => OkResponse(await _service.EnableRuleAsync(id, cancellationToken));

    [HttpPut("{id:long}/disable"), RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Disable(long id, CancellationToken cancellationToken) => OkResponse(await _service.DisableRuleAsync(id, cancellationToken));
}
