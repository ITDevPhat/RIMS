using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class Notification
{
    public long NotificationId { get; set; }

    public string NotificationType { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string PriorityLevel { get; set; } = null!;

    public string? RelatedEntityType { get; set; }

    public long? RelatedEntityId { get; set; }

    public string? RelatedEntityCode { get; set; }

    public string? ActionUrl { get; set; }

    public string? SuggestedAction { get; set; }

    public long? GeneratedByRuleId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual NotificationRule? GeneratedByRule { get; set; }

    public virtual ICollection<NotificationRecipient> NotificationRecipients { get; set; } = new List<NotificationRecipient>();
}
