namespace Rms.Application.Common;

public sealed record ServiceResult<T>(bool Success, string Message, T? Data, IReadOnlyList<string> Errors)
{
    public static ServiceResult<T> Ok(T? data, string message = "OK")
    {
        return new ServiceResult<T>(true, message, data, Array.Empty<string>());
    }

    public static ServiceResult<T> Fail(string message, params string[] errors)
    {
        return new ServiceResult<T>(false, message, default, errors);
    }
}
