using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Training;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/training-calendar")]
public sealed class TrainingCalendarController : ApiControllerBase
{
    private readonly ITrainingService _service;
    public TrainingCalendarController(ITrainingService service) => _service = service;

    [HttpGet("week"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Week([FromQuery] DateOnly? date, CancellationToken cancellationToken) => OkResponse(await _service.GetWeekAsync(date ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));

    [HttpGet("month"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Month([FromQuery] int year, [FromQuery] int month, CancellationToken cancellationToken) => OkResponse(await _service.GetMonthAsync(year, month, cancellationToken));

    [HttpGet("year"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Year([FromQuery] int year, CancellationToken cancellationToken) => OkResponse(await _service.GetYearAsync(year, cancellationToken));

    [HttpGet("schedule"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Schedule([FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken cancellationToken) => OkResponse(await _service.GetScheduleAsync(fromDate, toDate, cancellationToken));
}
