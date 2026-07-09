using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class LoginEvent
{
    public long LoginEventId { get; set; }

    public long? UserId { get; set; }

    public string? UsernameOrEmail { get; set; }

    public string EventType { get; set; } = null!;

    public bool Success { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? FailureReason { get; set; }

    public DateTime OccurredAt { get; set; }

    public virtual User? User { get; set; }
}
