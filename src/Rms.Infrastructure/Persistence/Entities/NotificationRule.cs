using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class NotificationRule
{
    public long RuleId { get; set; }

    public string RuleCode { get; set; } = null!;

    public string RuleName { get; set; } = null!;

    public string ObjectType { get; set; } = null!;

    public string ConditionType { get; set; } = null!;

    public int ReminderDays { get; set; }

    public bool ChannelInApp { get; set; }

    public bool ChannelEmail { get; set; }

    public string PriorityLevel { get; set; } = null!;

    public long? TemplateId { get; set; }

    public bool RepeatIfOverdue { get; set; }

    public int? RepeatIntervalDays { get; set; }

    public bool IsActive { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual NotificationTemplate? Template { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
