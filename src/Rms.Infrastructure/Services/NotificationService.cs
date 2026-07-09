using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Application.Notifications;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class NotificationService : INotificationService, INotificationRuleService, INotificationScannerService
{
    private readonly RmsDbContext _dbContext;
    private readonly IAuditService _auditService;
    private readonly IUserContext _userContext;

    public NotificationService(RmsDbContext dbContext, IAuditService auditService, IUserContext userContext)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _userContext = userContext;
    }

    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(NotificationQuery query, CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();
        var inbox = _dbContext.VUserNotificationInboxes.Where(x => x.UserId == userId);
        if (query.IsRead is not null) inbox = inbox.Where(x => x.IsRead == query.IsRead);
        if (!string.IsNullOrWhiteSpace(query.Category)) inbox = inbox.Where(x => x.Category == query.Category);
        if (!string.IsNullOrWhiteSpace(query.NotificationType)) inbox = inbox.Where(x => x.NotificationType == query.NotificationType);
        if (!string.IsNullOrWhiteSpace(query.Priority)) inbox = inbox.Where(x => x.PriorityLevel == query.Priority);
        if (query.FromDate is not null) inbox = inbox.Where(x => x.CreatedAt >= query.FromDate);
        if (query.ToDate is not null) inbox = inbox.Where(x => x.CreatedAt <= query.ToDate);
        if (!string.IsNullOrWhiteSpace(query.Search)) inbox = inbox.Where(x => x.Title.Contains(query.Search) || x.Message.Contains(query.Search));

        var total = await inbox.CountAsync(cancellationToken);
        var items = await inbox.OrderByDescending(x => x.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        return PagedResult<NotificationDto>.Create(items.Select(MapInbox).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<int> GetUnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();
        return await _dbContext.VUserNotificationInboxes.CountAsync(x => x.UserId == userId && !x.IsRead, cancellationToken);
    }

    public async Task<NotificationDto> GetNotificationAsync(long id, CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();
        var item = await _dbContext.VUserNotificationInboxes.FirstOrDefaultAsync(x => x.UserId == userId && x.NotificationId == id, cancellationToken);
        return item is null ? throw new NotFoundException("Notification not found.") : MapInbox(item);
    }

    public async Task MarkReadAsync(long id, CancellationToken cancellationToken = default)
    {
        var recipient = await GetRecipientAsync(id, cancellationToken);
        recipient.IsRead = true;
        recipient.ReadAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkUnreadAsync(long id, CancellationToken cancellationToken = default)
    {
        var recipient = await GetRecipientAsync(id, cancellationToken);
        recipient.IsRead = false;
        recipient.ReadAt = null;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllReadAsync(CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();
        var recipients = await _dbContext.NotificationRecipients
            .Where(x => x.UserId == userId && !x.IsDismissed && !x.IsRead)
            .ToListAsync(cancellationToken);
        foreach (var recipient in recipients)
        {
            recipient.IsRead = true;
            recipient.ReadAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", "read_all", $"Marked {recipients.Count} notifications as read", cancellationToken: cancellationToken);
    }

    public async Task DeleteNotificationAsync(long id, CancellationToken cancellationToken = default)
    {
        var recipient = await GetRecipientAsync(id, cancellationToken);
        recipient.IsDismissed = true;
        recipient.DismissedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", "delete", $"Dismissed notification {id}", "Notification", id, cancellationToken: cancellationToken);
    }

    public async Task<NotificationSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateSystemSettingsAsync(cancellationToken);
        return MapSettings(settings);
    }

    public async Task<NotificationSettingsDto> UpdateSettingsAsync(NotificationSettingsDto request, CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateSystemSettingsAsync(cancellationToken);
        settings.EnableSystemNotification = request.EnableSystemNotification;
        settings.EnableEmailNotification = request.EnableEmailNotification;
        settings.EnableInAppNotification = request.EnableInAppNotification;
        settings.DeadlineReminderDaysJson = SerializeDays(request.DeadlineReminderDays);
        settings.TrainingEventReminderDaysJson = SerializeDays(request.TrainingEventReminderDays);
        settings.EthicsReminderDaysJson = SerializeDays(request.EthicsReminderDays);
        settings.ProjectEndReminderDaysJson = SerializeDays(request.ProjectEndingReminderDays);
        settings.ProgressReportReminderDaysJson = SerializeDays(request.ProgressReportReminderDays);
        settings.RepeatIfOverdue = request.OverdueRepeatEnabled;
        settings.OverdueRepeatDays = Math.Max(request.OverdueRepeatDays, 1);
        settings.AutoResolveWhenCompleted = request.AutoMarkResolvedWhenCompleted;
        settings.DailyScanTime = new TimeOnly(Math.Clamp(request.ScannerRunHour, 0, 23), 0);
        settings.UpdatedAt = DateTime.UtcNow;
        settings.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", "configure", "Updated notification settings", "NotificationSetting", settings.NotificationSettingId, cancellationToken: cancellationToken);
        return MapSettings(settings);
    }

    public async Task<PagedResult<NotificationRuleDto>> GetRulesAsync(PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var rules = _dbContext.NotificationRules.Where(x => x.DeletedAt == null);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            rules = rules.Where(x => x.RuleCode.Contains(query.Search) || x.RuleName.Contains(query.Search) || x.ObjectType.Contains(query.Search));
        }

        var total = await rules.CountAsync(cancellationToken);
        var items = await rules.OrderBy(x => x.ObjectType).ThenBy(x => x.ReminderDays)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        return PagedResult<NotificationRuleDto>.Create(items.Select(MapRule).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<NotificationRuleDto> GetRuleAsync(long id, CancellationToken cancellationToken = default)
    {
        var rule = await _dbContext.NotificationRules.FirstOrDefaultAsync(x => x.RuleId == id && x.DeletedAt == null, cancellationToken);
        return rule is null ? throw new NotFoundException("Notification rule not found.") : MapRule(rule);
    }

    public async Task<NotificationRuleDto> CreateRuleAsync(NotificationRuleRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRule(request);
        var ruleCode = BuildRuleCode(request);
        if (await _dbContext.NotificationRules.AnyAsync(x => x.RuleCode == ruleCode, cancellationToken))
        {
            throw new InvalidOperationException("Notification rule code already exists.");
        }

        var rule = new NotificationRule
        {
            RuleCode = ruleCode,
            RuleName = request.RuleName.Trim(),
            ObjectType = request.TargetType.Trim(),
            ConditionType = request.ConditionType.Trim(),
            ReminderDays = request.RemindBeforeDays,
            ChannelInApp = request.Channels?.Contains("in_app") ?? true,
            ChannelEmail = request.Channels?.Contains("email") ?? false,
            PriorityLevel = Default(request.PriorityLevel, "medium"),
            TemplateId = request.TemplateId,
            RepeatIfOverdue = request.RepeatIfOverdue,
            RepeatIntervalDays = request.RepeatIntervalDays,
            IsActive = request.IsActive,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };
        _dbContext.NotificationRules.Add(rule);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", "create_rule", $"Created notification rule {rule.RuleCode}", "NotificationRule", rule.RuleId, rule.RuleCode, cancellationToken: cancellationToken);
        return MapRule(rule);
    }

    public async Task<NotificationRuleDto> UpdateRuleAsync(long id, NotificationRuleRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRule(request);
        var rule = await _dbContext.NotificationRules.FirstOrDefaultAsync(x => x.RuleId == id && x.DeletedAt == null, cancellationToken);
        if (rule is null) throw new NotFoundException("Notification rule not found.");
        var ruleCode = BuildRuleCode(request);
        if (await _dbContext.NotificationRules.AnyAsync(x => x.RuleId != id && x.RuleCode == ruleCode, cancellationToken))
        {
            throw new InvalidOperationException("Notification rule code already exists.");
        }

        rule.RuleCode = ruleCode;
        rule.RuleName = request.RuleName.Trim();
        rule.ObjectType = request.TargetType.Trim();
        rule.ConditionType = request.ConditionType.Trim();
        rule.ReminderDays = request.RemindBeforeDays;
        rule.ChannelInApp = request.Channels?.Contains("in_app") ?? true;
        rule.ChannelEmail = request.Channels?.Contains("email") ?? false;
        rule.PriorityLevel = Default(request.PriorityLevel, "medium");
        rule.TemplateId = request.TemplateId;
        rule.RepeatIfOverdue = request.RepeatIfOverdue;
        rule.RepeatIntervalDays = request.RepeatIntervalDays;
        rule.IsActive = request.IsActive;
        rule.Description = request.Description;
        rule.UpdatedAt = DateTime.UtcNow;
        rule.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", "update_rule", $"Updated notification rule {rule.RuleCode}", "NotificationRule", rule.RuleId, rule.RuleCode, cancellationToken: cancellationToken);
        return MapRule(rule);
    }

    public async Task DeleteRuleAsync(long id, CancellationToken cancellationToken = default)
    {
        var rule = await _dbContext.NotificationRules.FirstOrDefaultAsync(x => x.RuleId == id && x.DeletedAt == null, cancellationToken);
        if (rule is null) throw new NotFoundException("Notification rule not found.");
        rule.DeletedAt = DateTime.UtcNow;
        rule.DeletedBy = _userContext.User?.UserId;
        rule.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", "delete_rule", $"Deleted notification rule {rule.RuleCode}", "NotificationRule", rule.RuleId, rule.RuleCode, cancellationToken: cancellationToken);
    }

    public async Task<NotificationRuleDto> EnableRuleAsync(long id, CancellationToken cancellationToken = default) => await SetRuleActiveAsync(id, true, cancellationToken);
    public async Task<NotificationRuleDto> DisableRuleAsync(long id, CancellationToken cancellationToken = default) => await SetRuleActiveAsync(id, false, cancellationToken);

    public async Task<NotificationScanResultDto> ScanAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateSystemSettingsAsync(cancellationToken);
        if (!settings.EnableSystemNotification || !settings.EnableInAppNotification)
        {
            return new NotificationScanResultDto(0, 0, new[] { "Notification scanning is disabled by settings." });
        }

        var messages = new List<string>();
        var counters = new ScanCounters();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var days in ParseDays(settings.DeadlineReminderDaysJson))
        {
            var dueDate = today.AddDays(days);
            var deadlines = await _dbContext.ProjectDeadlines
                .Include(x => x.Project)
                .Where(x => x.DeletedAt == null && x.DeadlineStatus != "completed" && x.DueDate == dueDate)
                .ToListAsync(cancellationToken);
            foreach (var deadline in deadlines)
            {
                var recipients = await RecipientsForProjectItemAsync(deadline.ResponsibleUserId, deadline.Project?.PrincipalInvestigatorId, deadline.PriorityLevel, cancellationToken);
                await CreateNotificationAsync($"deadline_due_{days}", "deadline", days == 0 ? "Hạn chót đến hạn hôm nay" : "Hạn chót sắp đến hạn", $"Mốc tiến độ '{deadline.DeadlineTitle}' sẽ đến hạn sau {days} ngày.", NormalizePriority(deadline.PriorityLevel), "project_deadline", deadline.DeadlineId, deadline.Project?.ProjectCode, $"/research/deadlines/{deadline.DeadlineId}", "Xem hạn chót", recipients, counters, cancellationToken);
            }

            messages.Add($"Scanned project deadlines due in {days} day(s).");
        }

        var overdue = await _dbContext.ProjectDeadlines.Include(x => x.Project)
            .Where(x => x.DeletedAt == null && x.DeadlineStatus != "completed" && x.DueDate < today)
            .ToListAsync(cancellationToken);
        foreach (var deadline in overdue)
        {
            var recipients = await RecipientsForProjectItemAsync(deadline.ResponsibleUserId, deadline.Project?.PrincipalInvestigatorId, "urgent", cancellationToken);
            await CreateNotificationAsync("deadline_overdue", "deadline", "Hạn chót đã quá hạn", $"Mốc tiến độ '{deadline.DeadlineTitle}' đã quá hạn.", "urgent", "project_deadline", deadline.DeadlineId, deadline.Project?.ProjectCode, $"/research/deadlines/{deadline.DeadlineId}", "Xem hạn chót", recipients, counters, cancellationToken);
        }

        foreach (var days in ParseDays(settings.TrainingEventReminderDaysJson))
        {
            var targetDate = today.AddDays(days);
            var events = await _dbContext.TrainingEvents
                .Where(x => x.DeletedAt == null && x.IsActive && x.EventStatus != "completed" && x.EventStatus != "cancelled" && x.PlannedDate == targetDate)
                .ToListAsync(cancellationToken);
            foreach (var item in events)
            {
                var recipients = await RecipientsForTrainingAsync(item.ResponsibleUserId, cancellationToken);
                await CreateNotificationAsync($"training_upcoming_{days}", "training", days == 0 ? "Sự kiện đào tạo diễn ra hôm nay" : "Sự kiện đào tạo sắp diễn ra", $"Sự kiện '{item.EventTitle}' sẽ diễn ra sau {days} ngày.", "medium", "training_event", item.EventId, item.EventCode, $"/training/events/{item.EventId}", "Xem sự kiện", recipients, counters, cancellationToken);
            }

            messages.Add($"Scanned training events upcoming in {days} day(s).");
        }

        foreach (var days in ParseDays(settings.EthicsReminderDaysJson))
        {
            var targetDate = today.AddDays(days);
            var projects = await _dbContext.ResearchProjects.Where(x => x.DeletedAt == null && x.EthicsExpiryDate == targetDate).ToListAsync(cancellationToken);
            foreach (var project in projects)
            {
                var recipients = await RecipientsForProjectItemAsync(null, project.PrincipalInvestigatorId, "high", cancellationToken);
                await CreateNotificationAsync($"ethics_expiring_{days}", "ethics", "Ethics Approval sắp hết hạn", $"Ethics Approval của đề tài {project.ProjectCode} sẽ hết hạn sau {days} ngày.", "high", "research_project", project.ProjectId, project.ProjectCode, $"/research/projects/{project.ProjectId}", "Xem đề tài", recipients, counters, cancellationToken);
            }
        }

        foreach (var days in ParseDays(settings.ProjectEndReminderDaysJson))
        {
            var targetDate = today.AddDays(days);
            var projects = await _dbContext.ResearchProjects.Where(x => x.DeletedAt == null && x.ProjectStatus != "completed" && x.PlannedEndDate == targetDate).ToListAsync(cancellationToken);
            foreach (var project in projects)
            {
                var recipients = await RecipientsForProjectItemAsync(null, project.PrincipalInvestigatorId, project.PriorityLevel, cancellationToken);
                await CreateNotificationAsync($"project_ending_{days}", "research", "Đề tài sắp kết thúc", $"Đề tài {project.ProjectCode} sẽ kết thúc theo kế hoạch sau {days} ngày.", NormalizePriority(project.PriorityLevel), "research_project", project.ProjectId, project.ProjectCode, $"/research/projects/{project.ProjectId}", "Xem đề tài", recipients, counters, cancellationToken);
            }
        }

        foreach (var days in ParseDays(settings.DeadlineReminderDaysJson))
        {
            var targetDate = today.AddDays(days);
            var milestones = await _dbContext.ProjectMilestones.Include(x => x.Project)
                .Where(x => x.DeletedAt == null && x.MilestoneStatus != "completed" && x.DueDate == targetDate)
                .ToListAsync(cancellationToken);
            foreach (var item in milestones)
            {
                var recipients = await RecipientsForProjectItemAsync(item.OwnerUserId, item.Project.PrincipalInvestigatorId, item.PriorityLevel, cancellationToken);
                await CreateNotificationAsync($"milestone_due_{days}", "research", "Mốc tiến độ sắp đến hạn", $"Mốc tiến độ '{item.MilestoneName}' sẽ đến hạn sau {days} ngày.", NormalizePriority(item.PriorityLevel), "project_milestone", item.MilestoneId, item.Project.ProjectCode, $"/research/milestones/{item.MilestoneId}", "Xem mốc", recipients, counters, cancellationToken);
            }

            var phases = await _dbContext.ProjectPhases.Include(x => x.Project)
                .Where(x => x.DeletedAt == null && x.PhaseStatus != "completed" && x.DeadlineDate == targetDate)
                .ToListAsync(cancellationToken);
            foreach (var item in phases)
            {
                var recipients = await RecipientsForProjectItemAsync(item.OwnerUserId, item.Project.PrincipalInvestigatorId, item.Project.PriorityLevel, cancellationToken);
                await CreateNotificationAsync($"phase_due_{days}", "research", "Giai đoạn sắp đến hạn", $"Giai đoạn '{item.PhaseName}' sẽ đến hạn sau {days} ngày.", NormalizePriority(item.Project.PriorityLevel), "project_phase", item.PhaseId, item.Project.ProjectCode, $"/research/phases/{item.PhaseId}", "Xem giai đoạn", recipients, counters, cancellationToken);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        messages.Add($"Created {counters.Notifications} notifications and {counters.Recipients} recipients.");
        return new NotificationScanResultDto(counters.Notifications, counters.Recipients, messages);
    }

    private async Task<NotificationRuleDto> SetRuleActiveAsync(long id, bool isActive, CancellationToken cancellationToken)
    {
        var rule = await _dbContext.NotificationRules.FirstOrDefaultAsync(x => x.RuleId == id && x.DeletedAt == null, cancellationToken);
        if (rule is null) throw new NotFoundException("Notification rule not found.");
        rule.IsActive = isActive;
        rule.UpdatedAt = DateTime.UtcNow;
        rule.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("notification", isActive ? "enable_rule" : "disable_rule", $"{(isActive ? "Enabled" : "Disabled")} notification rule {rule.RuleCode}", "NotificationRule", rule.RuleId, rule.RuleCode, cancellationToken: cancellationToken);
        return MapRule(rule);
    }

    private async Task<NotificationRecipient> GetRecipientAsync(long notificationId, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        var recipient = await _dbContext.NotificationRecipients
            .Include(x => x.Notification)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.NotificationId == notificationId && !x.IsDismissed && !x.Notification.IsDeleted, cancellationToken);
        return recipient is null ? throw new NotFoundException("Notification not found.") : recipient;
    }

    private async Task<NotificationSetting> GetOrCreateSystemSettingsAsync(CancellationToken cancellationToken)
    {
        var settings = await _dbContext.NotificationSettings.FirstOrDefaultAsync(x => x.ScopeType == "system" && x.UserId == null, cancellationToken);
        if (settings is not null) return settings;
        settings = new NotificationSetting
        {
            ScopeType = "system",
            EnableSystemNotification = true,
            EnableEmailNotification = false,
            EnableInAppNotification = true,
            DeadlineReminderDaysJson = "[7,3,1,0]",
            TrainingEventReminderDaysJson = "[7,3,1,0]",
            EthicsReminderDaysJson = "[90,30,7]",
            ProjectEndReminderDaysJson = "[30,14,7]",
            ProgressReportReminderDaysJson = "[7,3,1]",
            DailyScanTime = new TimeOnly(7, 0),
            RepeatIfOverdue = true,
            OverdueRepeatDays = 1,
            AutoResolveWhenCompleted = true,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.NotificationSettings.Add(settings);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return settings;
    }

    private async Task CreateNotificationAsync(string notificationType, string category, string title, string message, string priority, string relatedType, long relatedId, string? relatedCode, string? actionUrl, string? actionLabel, IReadOnlyList<long> recipients, ScanCounters counters, CancellationToken cancellationToken)
    {
        if (recipients.Count == 0) return;
        var existingRecipientIds = await _dbContext.NotificationRecipients
            .Where(x => x.Notification.NotificationType == notificationType && x.Notification.RelatedEntityType == relatedType && x.Notification.RelatedEntityId == relatedId && recipients.Contains(x.UserId))
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);
        var newRecipients = recipients.Except(existingRecipientIds).Distinct().ToList();
        if (newRecipients.Count == 0) return;

        var notification = new Notification
        {
            NotificationType = notificationType,
            Category = category,
            Title = title,
            Message = message,
            PriorityLevel = priority,
            RelatedEntityType = relatedType,
            RelatedEntityId = relatedId,
            RelatedEntityCode = relatedCode,
            ActionUrl = actionUrl,
            SuggestedAction = actionLabel,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _dbContext.Notifications.Add(notification);
        foreach (var recipientId in newRecipients)
        {
            notification.NotificationRecipients.Add(new NotificationRecipient
            {
                UserId = recipientId,
                IsRead = false,
                IsDismissed = false,
                DeliveredInAppAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });
        }

        counters.Notifications++;
        counters.Recipients += newRecipients.Count;
    }

    private async Task<IReadOnlyList<long>> RecipientsForProjectItemAsync(long? responsibleUserId, long? principalInvestigatorId, string? priority, CancellationToken cancellationToken)
    {
        var ids = new List<long>();
        if (responsibleUserId is not null) ids.Add(responsibleUserId.Value);
        if (principalInvestigatorId is not null) ids.Add(principalInvestigatorId.Value);
        if (priority is "high" or "urgent" or "critical") ids.AddRange(await AdminUserIdsAsync(cancellationToken));
        if (ids.Count == 0) ids.AddRange(await AdminUserIdsAsync(cancellationToken));
        return ids.Distinct().ToList();
    }

    private async Task<IReadOnlyList<long>> RecipientsForTrainingAsync(long? responsibleUserId, CancellationToken cancellationToken)
    {
        if (responsibleUserId is not null) return new[] { responsibleUserId.Value };
        return await AdminUserIdsAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<long>> AdminUserIdsAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Users
            .Where(x => x.DeletedAt == null && x.AccountStatus == "active" && x.IsSystemAdmin)
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);
    }

    private long RequireUserId() => _userContext.User?.UserId ?? throw new InvalidOperationException("Authenticated user is required.");
    private static NotificationDto MapInbox(VUserNotificationInbox item) => new(item.NotificationId, item.Title, item.Message, item.NotificationType, item.Category, item.PriorityLevel, item.RelatedEntityType, item.RelatedEntityId, item.RelatedEntityCode, null, item.CreatedAt, item.IsRead, item.ReadAt, item.ActionUrl, item.SuggestedAction);
    private static NotificationRuleDto MapRule(NotificationRule item) => new(item.RuleId, item.RuleName, item.ObjectType, item.ConditionType, item.ReminderDays, Channels(item), item.PriorityLevel, item.IsActive, item.Description);
    private static NotificationSettingsDto MapSettings(NotificationSetting item) => new(item.EnableSystemNotification, item.EnableEmailNotification, item.EnableInAppNotification, ParseDays(item.DeadlineReminderDaysJson), ParseDays(item.TrainingEventReminderDaysJson), ParseDays(item.EthicsReminderDaysJson), ParseDays(item.ProjectEndReminderDaysJson), ParseDays(item.ProgressReportReminderDaysJson), item.RepeatIfOverdue, item.OverdueRepeatDays, item.AutoResolveWhenCompleted, item.DailyScanTime.Hour);
    private static IReadOnlyList<string> Channels(NotificationRule item) => new[] { item.ChannelInApp ? "in_app" : null, item.ChannelEmail ? "email" : null }.Where(x => x is not null).Cast<string>().ToList();
    private static IReadOnlyList<int> ParseDays(string json) => JsonSerializer.Deserialize<List<int>>(json) ?? new List<int>();
    private static string SerializeDays(IReadOnlyList<int> days) => JsonSerializer.Serialize(days.Where(x => x >= 0 && x <= 365).Distinct().OrderDescending().ToList());
    private static string Default(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    private static string NormalizePriority(string? value) => value is "high" or "urgent" or "medium" or "low" ? value : "medium";

    private static void ValidateRule(NotificationRuleRequest request)
    {
        if (request.RemindBeforeDays is < 0 or > 365) throw new InvalidOperationException("remindBeforeDays must be between 0 and 365.");
        var priority = Default(request.PriorityLevel, "medium");
        if (priority is not ("low" or "medium" or "high" or "urgent")) throw new InvalidOperationException("priorityLevel is invalid.");
    }

    private static string BuildRuleCode(NotificationRuleRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.RuleCode)) return request.RuleCode.Trim();
        return $"{request.TargetType.Trim()}_{request.ConditionType.Trim()}_{request.RemindBeforeDays}".ToLowerInvariant();
    }

    private sealed class ScanCounters
    {
        public int Notifications { get; set; }
        public int Recipients { get; set; }
    }
}
