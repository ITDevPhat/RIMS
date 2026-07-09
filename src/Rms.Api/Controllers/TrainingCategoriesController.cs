using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Training;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/training-categories")]
public sealed class TrainingCategoriesController : ApiControllerBase
{
    private readonly ITrainingService _service;
    public TrainingCategoriesController(ITrainingService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> List(CancellationToken cancellationToken) => OkResponse(await _service.GetCategoriesAsync(cancellationToken));

    [HttpGet("{id:long}"), RequirePermission(PermissionCodes.TrainingEventView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken) => OkResponse(await _service.GetCategoryAsync(id, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.TrainingEventCreate)]
    public async Task<IActionResult> Create(TrainingCategoryRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateCategoryAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.TrainingEventUpdate)]
    public async Task<IActionResult> Update(long id, TrainingCategoryRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateCategoryAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.TrainingEventDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteCategoryAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
