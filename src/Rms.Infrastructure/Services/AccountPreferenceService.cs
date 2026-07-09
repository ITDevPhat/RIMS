using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class AccountPreferenceService : IAccountPreferenceService
{
    private readonly RmsDbContext _dbContext;
    private readonly IAuditService _auditService;
    private readonly IUserContext _userContext;

    public AccountPreferenceService(RmsDbContext dbContext, IAuditService auditService, IUserContext userContext)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _userContext = userContext;
    }

    public async Task<AccountPreferenceDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var preference = await GetOrCreateAsync(cancellationToken);
        return Map(preference);
    }

    public async Task<AccountPreferenceDto> UpdateAsync(UpdatePreferenceRequest request, CancellationToken cancellationToken = default)
    {
        if (request.AppearanceMode is not ("light" or "dark" or "system"))
        {
            throw new InvalidOperationException("Appearance mode must be light, dark, or system.");
        }

        var preference = await GetOrCreateAsync(cancellationToken);
        preference.AppearanceMode = request.AppearanceMode;
        preference.LanguageCode = request.LanguageCode;
        preference.EnableInAppNotification = request.EnableInAppNotification;
        preference.EnableEmailNotification = request.EnableEmailNotification;
        preference.ReceiveDeadlineNotification = request.ReceiveDeadlineNotification;
        preference.ReceiveTrainingNotification = request.ReceiveTrainingNotification;
        preference.ReceiveEthicsNotification = request.ReceiveEthicsNotification;
        preference.AutoMarkReadOnOpen = request.AutoMarkReadOnOpen;
        preference.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        await _auditService.WriteActivityAsync("setting", "update", "Updated account preferences", "UserPreference", preference.PreferenceId, cancellationToken: cancellationToken);
        return Map(preference);
    }

    private async Task<UserPreference> GetOrCreateAsync(CancellationToken cancellationToken)
    {
        var userId = _userContext.User?.UserId ?? throw new InvalidOperationException("Unauthenticated.");
        var preference = await _dbContext.UserPreferences.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (preference is not null)
        {
            return preference;
        }

        preference = new UserPreference
        {
            UserId = userId,
            AppearanceMode = "system",
            LanguageCode = "vi-VN",
            EnableInAppNotification = true,
            EnableEmailNotification = false,
            ReceiveDeadlineNotification = true,
            ReceiveTrainingNotification = true,
            ReceiveEthicsNotification = true,
            AutoMarkReadOnOpen = false,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.UserPreferences.Add(preference);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return preference;
    }

    private static AccountPreferenceDto Map(UserPreference preference)
    {
        return new AccountPreferenceDto(
            preference.AppearanceMode,
            preference.LanguageCode,
            preference.EnableInAppNotification,
            preference.EnableEmailNotification,
            preference.ReceiveDeadlineNotification,
            preference.ReceiveTrainingNotification,
            preference.ReceiveEthicsNotification,
            preference.AutoMarkReadOnOpen);
    }
}
