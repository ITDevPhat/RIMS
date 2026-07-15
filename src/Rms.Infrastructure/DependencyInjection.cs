using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        var connectionString = configuration.GetConnectionString("DefaultConnection");
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
}
