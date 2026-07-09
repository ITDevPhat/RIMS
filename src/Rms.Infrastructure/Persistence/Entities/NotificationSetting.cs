using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class NotificationSetting
{
    public long NotificationSettingId { get; set; }

    public string ScopeType { get; set; } = null!;

    public long? UserId { get; set; }

    public bool EnableSystemNotification { get; set; }

    public bool EnableEmailNotification { get; set; }

    public bool EnableInAppNotification { get; set; }

    public string DeadlineReminderDaysJson { get; set; } = null!;

    public string TrainingEventReminderDaysJson { get; set; } = null!;

    public string EthicsReminderDaysJson { get; set; } = null!;

    public string ProjectEndReminderDaysJson { get; set; } = null!;

    public string ProgressReportReminderDaysJson { get; set; } = null!;

    public TimeOnly DailyScanTime { get; set; }

    public bool RepeatIfOverdue { get; set; }

    public int OverdueRepeatDays { get; set; }

    public bool AutoResolveWhenCompleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual User? User { get; set; }
}
