using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Infrastructure.Persistence;

namespace Rms.Api.Controllers;

[AllowAnonymous]
[Route("api/health")]
public sealed class HealthController : ApiControllerBase
{
    private readonly RmsDbContext _dbContext;

    public HealthController(RmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return OkResponse(new
        {
            service = "RMS API",
            status = "healthy",
            timestamp = DateTimeOffset.UtcNow
        });
    }

    [HttpGet("db")]
    [HttpGet("database")]
    public async Task<IActionResult> Db(CancellationToken cancellationToken)
    {
        var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        if (!canConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                success = false,
                message = "Không thể kết nối Neon PostgreSQL."
            });
        }

        var userCount = await _dbContext.Users.CountAsync(cancellationToken);
        return OkResponse(new
        {
            success = true,
            message = "Kết nối Neon PostgreSQL thành công.",
            database = _dbContext.Database.GetDbConnection().Database,
            userCount
        });
    }
}
