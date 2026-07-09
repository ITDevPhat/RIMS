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
        return OkResponse(new { status = "healthy", utcNow = DateTime.UtcNow });
    }

    [HttpGet("db")]
    public async Task<IActionResult> Db(CancellationToken cancellationToken)
    {
        var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        var userCount = await _dbContext.Users.CountAsync(cancellationToken);
        return OkResponse(new { canConnect, database = _dbContext.Database.GetDbConnection().Database, userCount });
    }
}
