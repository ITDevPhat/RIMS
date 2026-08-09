using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Admin;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/departments")]
public sealed class DepartmentsController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public DepartmentsController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List([FromQuery] DepartmentQuery query, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetDepartmentsAsync(query, cancellationToken));
    }

    [HttpGet("{id:long}")]
    [Authorize]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetDepartmentAsync(id, cancellationToken));
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Create(CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.CreateDepartmentAsync(request, cancellationToken), "Created");
    }

    [HttpPut("{id:long}")]
    [RequirePermission(PermissionCodes.SettingUpdate)]
    public async Task<IActionResult> Update(long id, UpdateDepartmentRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateDepartmentAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [RequirePermission(PermissionCodes.SettingConfigure)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteDepartmentAsync(id, cancellationToken);
        return NoDataResponse();
    }
}
