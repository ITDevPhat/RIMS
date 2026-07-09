using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class VUserNotificationInbox
{
    public long NotificationRecipientId { get; set; }

    public long NotificationId { get; set; }

    public long UserId { get; set; }

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

    public DateTime CreatedAt { get; set; }

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public bool IsDismissed { get; set; }

    public DateTime? DismissedAt { get; set; }
}
