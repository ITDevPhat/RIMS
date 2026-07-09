using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Notifications;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/notification-settings")]
public sealed class NotificationSettingsController : ApiControllerBase
{
    private readonly INotificationService _service;
    public NotificationSettingsController(INotificationService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) => OkResponse(await _service.GetSettingsAsync(cancellationToken));

    [HttpPut, RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Update(NotificationSettingsDto request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateSettingsAsync(request, cancellationToken));
}
