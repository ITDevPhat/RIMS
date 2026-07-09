using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/permissions")]
public sealed class PermissionsController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public PermissionsController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [RequirePermission(PermissionCodes.PermissionView)]
    public async Task<IActionResult> List([FromQuery] PaginationQuery query, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetPermissionsAsync(query, cancellationToken));
    }

    [HttpGet("matrix")]
    [RequirePermission(PermissionCodes.PermissionView)]
    public async Task<IActionResult> Matrix(CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetPermissionMatrixAsync(cancellationToken));
    }

    [HttpPut("{id:long}")]
    [RequirePermission(PermissionCodes.PermissionUpdate)]
    public async Task<IActionResult> Update(long id, UpdatePermissionRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdatePermissionAsync(id, request, cancellationToken));
    }
}
