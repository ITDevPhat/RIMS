using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Notifications;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/notifications")]
public sealed class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _service;
    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.NotificationView)]
    public async Task<IActionResult> List([FromQuery] NotificationQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetNotificationsAsync(query, cancellationToken));

    [HttpGet("unread-count"), RequirePermission(PermissionCodes.NotificationView)]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken) => OkResponse(new { count = await _service.GetUnreadCountAsync(cancellationToken) });

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.NotificationView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetNotificationAsync(id, cancellationToken));

    [HttpPut("{id:long}/read"), RequirePermission(PermissionCodes.NotificationUpdate)]
    public async Task<IActionResult> Read(long id, CancellationToken cancellationToken)
    {
        await _service.MarkReadAsync(id, cancellationToken);
        return NoDataResponse();
    }

    [HttpPut("{id:long}/unread"), RequirePermission(PermissionCodes.NotificationUpdate)]
    public async Task<IActionResult> Unread(long id, CancellationToken cancellationToken)
    {
        await _service.MarkUnreadAsync(id, cancellationToken);
        return NoDataResponse();
    }

    [HttpPut("read-all"), RequirePermission(PermissionCodes.NotificationUpdate)]
    public async Task<IActionResult> ReadAll(CancellationToken cancellationToken)
    {
        await _service.MarkAllReadAsync(cancellationToken);
        return NoDataResponse();
    }

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.NotificationDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteNotificationAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
