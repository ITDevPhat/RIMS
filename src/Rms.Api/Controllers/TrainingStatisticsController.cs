using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Training;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/training-statistics")]
public sealed class TrainingStatisticsController : ApiControllerBase
{
    private readonly ITrainingService _service;
    public TrainingStatisticsController(ITrainingService service) => _service = service;

    [HttpGet("yearly"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Yearly([FromQuery] int year, CancellationToken cancellationToken) => OkResponse(await _service.GetYearlyStatisticsAsync(year, cancellationToken));
}
