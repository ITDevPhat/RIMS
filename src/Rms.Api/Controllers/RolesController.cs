using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/roles")]
public sealed class RolesController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public RolesController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [RequirePermission(PermissionCodes.RoleView)]
    public async Task<IActionResult> List([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetRolesAsync(query, cancellationToken));
    }

    [HttpGet("{id:long}")]
    [RequirePermission(PermissionCodes.RoleView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetRoleAsync(id, cancellationToken));
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.RoleCreate)]
    public async Task<IActionResult> Create(CreateRoleRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.CreateRoleAsync(request, cancellationToken), "Created");
    }

    [HttpPut("{id:long}")]
    [RequirePermission(PermissionCodes.RoleUpdate)]
    public async Task<IActionResult> Update(long id, UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateRoleAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [RequirePermission(PermissionCodes.RoleDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteRoleAsync(id, cancellationToken);
        return NoDataResponse();
    }

    [HttpGet("{roleId:long}/permissions")]
    [RequirePermission(PermissionCodes.PermissionView)]
    public async Task<IActionResult> GetPermissions(long roleId, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetRolePermissionsAsync(roleId, cancellationToken));
    }

    [HttpPut("{roleId:long}/permissions")]
    [RequirePermission(PermissionCodes.PermissionConfigure)]
    public async Task<IActionResult> UpdatePermissions(long roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateRolePermissionsAsync(roleId, request.PermissionIds, cancellationToken));
    }
}
