using Rms.Application.Auth;

namespace Rms.Infrastructure.Security;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(UserProfileDto user, long sessionId);
    string HashToken(string token);
}
