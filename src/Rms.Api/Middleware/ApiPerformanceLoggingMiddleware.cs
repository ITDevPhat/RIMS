using System.Diagnostics;

namespace Rms.Api.Middleware;

/// <summary>Records end-to-end timings for the slow post-login endpoints without exposing them to clients.</summary>
public sealed class ApiPerformanceLoggingMiddleware
{
    private static readonly string[] ProfiledPaths =
    [
        "/api/notifications",
        "/api/dashboard/research-overview",
        "/api/dashboard/deadlines"
    ];

    private readonly RequestDelegate _next;
    private readonly ILogger<ApiPerformanceLoggingMiddleware> _logger;

    public ApiPerformanceLoggingMiddleware(RequestDelegate next, ILogger<ApiPerformanceLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ProfiledPaths.Any(path => context.Request.Path.StartsWithSegments(path)))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        finally
        {
            _logger.LogInformation(
                "API PROFILE {Method} {Path} status={StatusCode} total={ElapsedMs}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}
