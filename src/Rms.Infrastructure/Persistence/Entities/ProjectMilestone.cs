using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ProjectMilestone
{
    public long MilestoneId { get; set; }

    public long ProjectId { get; set; }

    public long? PhaseId { get; set; }

    public string? MilestoneCode { get; set; }

    public string MilestoneName { get; set; } = null!;

    public string? MilestoneDescription { get; set; }

    public DateOnly DueDate { get; set; }

    public DateOnly? CompletedDate { get; set; }

    public long? OwnerUserId { get; set; }

    public string MilestoneStatus { get; set; } = null!;

    public string PriorityLevel { get; set; } = null!;

    public string? Notes { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual User? OwnerUser { get; set; }

    public virtual ProjectPhase? Phase { get; set; }

    public virtual ResearchProject Project { get; set; } = null!;

    public virtual ICollection<ProjectDeadline> ProjectDeadlines { get; set; } = new List<ProjectDeadline>();

    public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; } = new List<ProjectDocument>();

    public virtual User? UpdatedByNavigation { get; set; }
}
