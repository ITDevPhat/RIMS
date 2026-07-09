using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class LoginSession
{
    public long SessionId { get; set; }

    public long UserId { get; set; }

    public string? SessionTokenHash { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? DeviceName { get; set; }

    public DateTime LoginAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? LogoutAt { get; set; }

    public string? LogoutReason { get; set; }

    public bool IsActive { get; set; }

    public virtual User User { get; set; } = null!;
}
