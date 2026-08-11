using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Admin;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/master-data")]
public sealed class MasterDataController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public MasterDataController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List([FromQuery] MasterDataQuery query, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetMasterDataItemsAsync(query, cancellationToken));
    }

    [HttpGet("{id:long}")]
    [Authorize]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetMasterDataItemAsync(id, cancellationToken));
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Create(CreateMasterDataItemRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.CreateMasterDataItemAsync(request, cancellationToken), "Created");
    }

    [HttpPut("{id:long}")]
    [RequirePermission(PermissionCodes.SettingUpdate)]
    public async Task<IActionResult> Update(long id, UpdateMasterDataItemRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateMasterDataItemAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteMasterDataItemAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
