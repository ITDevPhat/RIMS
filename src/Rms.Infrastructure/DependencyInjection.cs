using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Rms.Application.Admin;
using Rms.Application.Auth;
using Rms.Application.Dashboard;
using Rms.Application.Notifications;
using Rms.Application.Research;
using Rms.Application.Training;
using Rms.Infrastructure.Options;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Security;
using Rms.Infrastructure.Services;

namespace Rms.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        var connectionString = NormalizePostgresConnectionString(
            configuration.GetConnectionString("DefaultConnection"));
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Không tìm thấy ConnectionStrings:DefaultConnection.");
        }

        services.AddDbContext<RmsDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IAccountPreferenceService, AccountPreferenceService>();
        services.AddScoped<IResearchService, ResearchService>();
        services.AddScoped<ITrainingService, TrainingService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<IDashboardService>(provider => provider.GetRequiredService<DashboardService>());
        services.AddScoped<IAuditQueryService>(provider => provider.GetRequiredService<DashboardService>());
        services.AddScoped<NotificationService>();
        services.AddScoped<INotificationService>(provider => provider.GetRequiredService<NotificationService>());
        services.AddScoped<INotificationRuleService>(provider => provider.GetRequiredService<NotificationService>());
        services.AddScoped<INotificationScannerService>(provider => provider.GetRequiredService<NotificationService>());
        services.AddHostedService<NotificationScannerBackgroundService>();
        services.AddScoped<DevelopmentAdminSeeder>();
        return services;
    }

    private static string? NormalizePostgresConnectionString(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "postgresql" && uri.Scheme != "postgres"))
        {
            return connectionString;
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty),
            Password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty),
            SslMode = SslMode.Require
        };

        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        foreach (var key in query.AllKeys)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            var value = query[key];
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            switch (key.ToLowerInvariant())
            {
                case "sslmode":
                    if (Enum.TryParse<SslMode>(value, ignoreCase: true, out var sslMode))
                    {
                        builder.SslMode = sslMode;
                    }
                    break;
                case "channel_binding":
                    builder["Channel Binding"] = value;
                    break;
            }
        }

        return builder.ConnectionString;
    }
}
