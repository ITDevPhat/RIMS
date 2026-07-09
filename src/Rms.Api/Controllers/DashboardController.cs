using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Dashboard;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/dashboard")]
public sealed class DashboardController : ApiControllerBase
{
    private readonly IDashboardService _service;
    public DashboardController(IDashboardService service) => _service = service;

    [HttpGet("research-overview"), RequirePermission(PermissionCodes.DashboardView)]
    public async Task<IActionResult> ResearchOverview([FromQuery] int year, CancellationToken cancellationToken) => OkResponse(await _service.GetResearchOverviewAsync(year, cancellationToken));

    [HttpGet("training-overview"), RequirePermission(PermissionCodes.DashboardView)]
    public async Task<IActionResult> TrainingOverview([FromQuery] int year, CancellationToken cancellationToken) => OkResponse(await _service.GetTrainingOverviewAsync(year, cancellationToken));

    [HttpGet("deadlines"), RequirePermission(PermissionCodes.DashboardView)]
    public async Task<IActionResult> Deadlines([FromQuery] int days = 30, CancellationToken cancellationToken = default) => OkResponse(await _service.GetDeadlinesAsync(days, cancellationToken));
}
