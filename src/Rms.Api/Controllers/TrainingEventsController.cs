using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Training;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/training-events")]
public sealed class TrainingEventsController : ApiControllerBase
{
    private readonly ITrainingService _service;
    public TrainingEventsController(ITrainingService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> List([FromQuery] TrainingEventQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetEventsAsync(query, cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetEventAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.TrainingEventCreate)]
    public async Task<IActionResult> Create(TrainingEventRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateEventAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.TrainingEventUpdate)]
    public async Task<IActionResult> Update(long id, TrainingEventRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateEventAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.TrainingEventDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteEventAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
