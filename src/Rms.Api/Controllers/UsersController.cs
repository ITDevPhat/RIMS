using Microsoft.AspNetCore.Mvc;
using Rms.Api.Security;
using Rms.Application.Admin;
using Rms.Domain.Constants;

namespace Rms.Api.Controllers;

[Route("api/users")]
public sealed class UsersController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public UsersController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet]
    [RequirePermission(PermissionCodes.UserView)]
    public async Task<IActionResult> List([FromQuery] UserListQuery query, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetUsersAsync(query, cancellationToken));
    }

    [HttpGet("{id:long}")]
    [RequirePermission(PermissionCodes.UserView)]
    public async Task<IActionResult> Get(long id, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.GetUserAsync(id, cancellationToken));
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.UserCreate)]
    public async Task<IActionResult> Create(CreateUserRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.CreateUserAsync(request, cancellationToken), "Created");
    }

    [HttpPut("{id:long}")]
    [RequirePermission(PermissionCodes.UserUpdate)]
    public async Task<IActionResult> Update(long id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UpdateUserAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:long}")]
    [RequirePermission(PermissionCodes.UserDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _adminService.DeleteUserAsync(id, cancellationToken);
        return NoDataResponse();
    }

    [HttpPut("{id:long}/lock")]
    [RequirePermission(PermissionCodes.UserUpdate)]
    public async Task<IActionResult> Lock(long id, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.LockUserAsync(id, cancellationToken));
    }

    [HttpPut("{id:long}/unlock")]
    [RequirePermission(PermissionCodes.UserUpdate)]
    public async Task<IActionResult> Unlock(long id, CancellationToken cancellationToken)
    {
        return OkResponse(await _adminService.UnlockUserAsync(id, cancellationToken));
    }

    [HttpPost("{id:long}/reset-password")]
    [RequirePermission(PermissionCodes.UserUpdate)]
    public async Task<IActionResult> ResetPassword(long id, ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var temporaryPassword = await _adminService.ResetPasswordAsync(id, request, cancellationToken);
        return OkResponse(new { temporaryPassword });
    }
}
