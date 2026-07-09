using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class NotificationRecipient
{
    public long NotificationRecipientId { get; set; }

    public long NotificationId { get; set; }

    public long UserId { get; set; }

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public bool IsDismissed { get; set; }

    public DateTime? DismissedAt { get; set; }

    public DateTime? DeliveredInAppAt { get; set; }

    public DateTime? DeliveredEmailAt { get; set; }

    public string? EmailSendStatus { get; set; }

    public string? EmailFailureReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Notification Notification { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
