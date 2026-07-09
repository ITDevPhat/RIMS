using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ProjectPhase
{
    public long PhaseId { get; set; }

    public long ProjectId { get; set; }

    public string? PhaseCode { get; set; }

    public string PhaseName { get; set; } = null!;

    public string? PhaseDescription { get; set; }

    public long? OwnerUserId { get; set; }

    public DateOnly? PlannedStartDate { get; set; }

    public DateOnly? PlannedEndDate { get; set; }

    public DateOnly? DeadlineDate { get; set; }

    public DateOnly? ActualStartDate { get; set; }

    public DateOnly? ActualEndDate { get; set; }

    public decimal ProgressPercent { get; set; }

    public string PhaseStatus { get; set; } = null!;

    public int SortOrder { get; set; }

    public string? Notes { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual User? OwnerUser { get; set; }

    public virtual ResearchProject Project { get; set; } = null!;

    public virtual ICollection<ProjectDeadline> ProjectDeadlines { get; set; } = new List<ProjectDeadline>();

    public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; } = new List<ProjectDocument>();

    public virtual ICollection<ProjectMilestone> ProjectMilestones { get; set; } = new List<ProjectMilestone>();

    public virtual User? UpdatedByNavigation { get; set; }
}
