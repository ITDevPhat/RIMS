using Rms.Application.Common;

namespace Rms.Application.Auth;

public interface IAuthService
{
    Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult<object>> LogoutAsync(CancellationToken cancellationToken = default);
    Task<ServiceResult<UserProfileDto>> GetMeAsync(CancellationToken cancellationToken = default);
    Task<ServiceResult<object>> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default);
}
