namespace Rms.Application.Common;

public sealed record ApiResponse<T>(
    bool Success,
    string Message,
    T? Data,
    IReadOnlyList<string> Errors)
{
    public static ApiResponse<T> Ok(T? data, string message = "OK")
    {
        return new ApiResponse<T>(true, message, data, Array.Empty<string>());
    }

    public static ApiResponse<T> Fail(string message, params string[] errors)
    {
        return new ApiResponse<T>(false, message, default, errors);
    }
}

public sealed record ApiResponse(bool Success, string Message, object? Data, IReadOnlyList<string> Errors)
{
    public static ApiResponse Ok(object? data = null, string message = "OK")
    {
        return new ApiResponse(true, message, data, Array.Empty<string>());
    }

    public static ApiResponse Fail(string message, params string[] errors)
    {
        return new ApiResponse(false, message, null, errors);
    }
}
