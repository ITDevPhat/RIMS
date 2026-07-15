using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Rms.Application.Notifications;

namespace Rms.Infrastructure.Services;

public sealed class NotificationScannerBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationScannerBackgroundService> _logger;
    private DateOnly? _lastRunDate;

    public NotificationScannerBackgroundService(IServiceProvider serviceProvider, IConfiguration configuration, ILogger<NotificationScannerBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var enabled = _configuration.GetValue("NotificationScanner:Enabled", false);
                    var runHour = Math.Clamp(_configuration.GetValue("NotificationScanner:RunHour", 7), 0, 23);
                    var now = DateTime.UtcNow;
                    var today = DateOnly.FromDateTime(now);
                    if (enabled && now.Hour == runHour && _lastRunDate != today)
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var scanner = scope.ServiceProvider.GetRequiredService<INotificationScannerService>();
                        var result = await scanner.ScanAsync(stoppingToken);
                        _lastRunDate = today;
                        _logger.LogInformation("Notification scanner created {NotificationCount} notifications for {RecipientCount} recipients.", result.CreatedNotifications, result.CreatedRecipients);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Notification scanner failed.");
                }

                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal shutdown path.
        }
    }
}
