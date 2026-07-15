using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class TrainingEvent
{
    public long EventId { get; set; }

    public string EventCode { get; set; } = null!;

    public string EventTitle { get; set; } = null!;

    public string? EventDescription { get; set; }

    public int EventYear { get; set; }

    public int EventMonth { get; set; }

    public DateOnly? PlannedDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public DateOnly? ActualDate { get; set; }

    public long? CategoryId { get; set; }

    public string EventType { get; set; } = null!;

    public string PlanType { get; set; } = null!;

    public long? DepartmentId { get; set; }

    public long? ResponsibleUserId { get; set; }

    public string? Location { get; set; }

    public string DeliveryMode { get; set; } = null!;

    public int? PlannedAttendees { get; set; }

    public int? ActualAttendees { get; set; }

    public string EventStatus { get; set; } = null!;

    public string? CancellationReason { get; set; }

    public string? Notes { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual EventCategory? Category { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual Department? Department { get; set; }

    public virtual User? ResponsibleUser { get; set; }

    public virtual ICollection<TrainingEventLog> TrainingEventLogs { get; set; } = new List<TrainingEventLog>();

    public virtual ICollection<TrainingEventParticipant> TrainingEventParticipants { get; set; } = new List<TrainingEventParticipant>();

    public virtual User? UpdatedByNavigation { get; set; }
}
