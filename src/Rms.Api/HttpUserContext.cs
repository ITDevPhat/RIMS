using System.Security.Claims;
using Rms.Application.Common;

namespace Rms.Api;

public sealed class HttpUserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public CurrentUser? User
    {
        get
        {
            var principal = _httpContextAccessor.HttpContext?.User;
            if (principal?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            var userIdValue = principal.FindFirstValue("user_id") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(userIdValue, out var userId))
            {
                return null;
            }

            var sessionIdValue = principal.FindFirstValue("session_id");
            long? sessionId = long.TryParse(sessionIdValue, out var parsedSessionId) ? parsedSessionId : null;
            var username = principal.FindFirstValue("username") ?? string.Empty;
            var roles = principal.FindAll(ClaimTypes.Role).Select(x => x.Value).ToList();
            var permissions = principal.FindAll("permission").Select(x => x.Value).ToList();
            return new CurrentUser(userId, sessionId, username, roles, permissions);
        }
    }

    public string? IpAddress => _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
    public string? UserAgent => _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString();
    public string? RequestId => _httpContextAccessor.HttpContext?.TraceIdentifier;
}
