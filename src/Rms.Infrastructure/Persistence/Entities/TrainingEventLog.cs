using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class TrainingEventLog
{
    public long EventLogId { get; set; }

    public long EventId { get; set; }

    public string ActionType { get; set; } = null!;

    public string? OldValueJson { get; set; }

    public string? NewValueJson { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual TrainingEvent Event { get; set; } = null!;
}
