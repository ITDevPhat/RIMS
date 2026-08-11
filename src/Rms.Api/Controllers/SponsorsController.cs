using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Research;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/sponsors")]
public sealed class SponsorsController : ApiControllerBase
{
    private readonly IResearchService _service;
    public SponsorsController(IResearchService service) => _service = service;

    [HttpGet, RequirePermission(PermissionCodes.ResearchProjectView)]
    public async Task<IActionResult> List([FromQuery] SponsorQuery query, CancellationToken cancellationToken) => OkResponse(await _service.GetSponsorsAsync(query, cancellationToken));

    [HttpPost, RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Create(CreateSponsorRequest request, CancellationToken cancellationToken) => OkResponse(await _service.CreateSponsorAsync(request, cancellationToken), "Created");

    [HttpPut("{id:long}"), RequirePermission(PermissionCodes.SettingUpdate)]
    public async Task<IActionResult> Update(long id, UpdateSponsorRequest request, CancellationToken cancellationToken) => OkResponse(await _service.UpdateSponsorAsync(id, request, cancellationToken));

    [HttpDelete("{id:long}"), RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _service.DeleteSponsorAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
