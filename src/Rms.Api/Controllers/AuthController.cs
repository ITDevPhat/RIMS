using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rms.Application.Auth;

namespace Rms.Api.Controllers;

[Route("api/auth")]
public sealed class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        if (!result.Success)
        {
            return Unauthorized(Rms.Application.Common.ApiResponse<LoginResponse>.Fail(result.Message, result.Errors.ToArray()));
        }

        return Ok(Rms.Application.Common.ApiResponse<LoginResponse>.Ok(result.Data, result.Message));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        return ServiceResponse(await _authService.LogoutAsync(cancellationToken));
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        return ServiceResponse(await _authService.GetMeAsync(cancellationToken));
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        return ServiceResponse(await _authService.ChangePasswordAsync(request, cancellationToken));
    }
}
