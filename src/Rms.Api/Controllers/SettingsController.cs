using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/settings")]
public sealed class SettingsController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public SettingsController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [RequirePermission(PermissionCodes.SettingView)]
    public async Task<IActionResult> List([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetSettingsAsync(query, cancellationToken));
    }

    [HttpGet("{key}")]
    [RequirePermission(PermissionCodes.SettingView)]
    public async Task<IActionResult> GetByKey(string key, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetSettingByKeyAsync(key, cancellationToken));
    }

    [HttpGet("group/{groupCode}")]
    [RequirePermission(PermissionCodes.SettingView)]
    public async Task<IActionResult> GetByGroup(string groupCode, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetSettingsByGroupAsync(groupCode, cancellationToken));
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Create(CreateSettingRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.CreateSettingAsync(request, cancellationToken), "Created");
    }

    [HttpPut("{id:long}")]
    [RequirePermission(PermissionCodes.SettingUpdate)]
    public async Task<IActionResult> Update(long id, UpdateSettingRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateSettingAsync(id, request, cancellationToken));
    }

    [HttpPut("{key}")]
    [RequirePermission(PermissionCodes.SettingUpdate)]
    public async Task<IActionResult> UpdateByKey(string key, UpdateSettingRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateSettingByKeyAsync(key, request, cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteSettingAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
