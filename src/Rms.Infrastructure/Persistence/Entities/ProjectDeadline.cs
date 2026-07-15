using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ProjectDeadline
{
    public long DeadlineId { get; set; }

    public long? ProjectId { get; set; }

    public long? PhaseId { get; set; }

    public long? MilestoneId { get; set; }

    public string DeadlineType { get; set; } = null!;

    public string DeadlineTitle { get; set; } = null!;

    public string? DeadlineDescription { get; set; }

    public DateOnly DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    public long? ResponsibleUserId { get; set; }

    public string PriorityLevel { get; set; } = null!;

    public string DeadlineStatus { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ProjectMilestone? Milestone { get; set; }

    public virtual ProjectPhase? Phase { get; set; }

    public virtual ResearchProject? Project { get; set; }

    public virtual User? ResponsibleUser { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
