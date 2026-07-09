namespace Rms.Application.Common;

public sealed record CurrentUser(
    long UserId,
    long? SessionId,
    string Username,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

public interface IUserContext
{
    CurrentUser? User { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }
    string? RequestId { get; }
}
