using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class TrainingEventParticipant
{
    public long ParticipantId { get; set; }

    public long EventId { get; set; }

    public long? UserId { get; set; }

    public string ParticipantName { get; set; } = null!;

    public string? ParticipantEmail { get; set; }

    public long? DepartmentId { get; set; }

    public string AttendanceStatus { get; set; } = null!;

    public DateTime? CheckedInAt { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Department? Department { get; set; }

    public virtual TrainingEvent Event { get; set; } = null!;

    public virtual User? User { get; set; }
}
