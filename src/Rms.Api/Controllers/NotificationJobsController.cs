using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Notifications;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/jobs")]
public sealed class NotificationJobsController : ApiControllerBase
{
    private readonly INotificationScannerService _scanner;
    public NotificationJobsController(INotificationScannerService scanner) => _scanner = scanner;

    [HttpPost("notification-scan"), RequirePermission(PermissionCodes.NotificationConfigure)]
    public async Task<IActionResult> Scan(CancellationToken cancellationToken) => OkResponse(await _scanner.ScanAsync(cancellationToken));
}
