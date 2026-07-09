using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ActivityLog
{
    public long ActivityLogId { get; set; }

    public DateTime OccurredAt { get; set; }

    public long? UserId { get; set; }

    public string ModuleCode { get; set; } = null!;

    public string ActionType { get; set; } = null!;

    public string? EntityType { get; set; }

    public long? EntityId { get; set; }

    public string? EntityCode { get; set; }

    public string ActionSummary { get; set; } = null!;

    public string? OldValueJson { get; set; }

    public string? NewValueJson { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? RequestId { get; set; }

    public string Status { get; set; } = null!;

    public string? ErrorMessage { get; set; }

    public virtual User? User { get; set; }
}
