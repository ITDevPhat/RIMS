using Microsoft.AspNetCore.Mvc;
using Rms.Application.Common;

namespace Rms.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult OkResponse<T>(T data, string message = "OK")
    {
        return Ok(ApiResponse<T>.Ok(data, message));
    }

    protected IActionResult NoDataResponse(string message = "OK")
    {
        return Ok(ApiResponse.Ok(null, message));
    }

    protected IActionResult ServiceResponse<T>(ServiceResult<T> result)
    {
        if (result.Success)
        {
            return Ok(ApiResponse<T>.Ok(result.Data, result.Message));
        }

        return BadRequest(ApiResponse<T>.Fail(result.Message, result.Errors.ToArray()));
    }
}
