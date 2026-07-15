using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ResearchProject
{
    public long ProjectId { get; set; }

    public string ProjectCode { get; set; } = null!;

    public string ProjectTitle { get; set; } = null!;

    public string? ProjectDescription { get; set; }

    public long? LeadDepartmentId { get; set; }

    public long? PrincipalInvestigatorId { get; set; }

    public long? SponsorId { get; set; }

    public string? SponsorNameText { get; set; }

    public string? ResearchType { get; set; }

    public string? ProtocolNumber { get; set; }

    public string? ProtocolVersion { get; set; }

    public string EthicsStatus { get; set; } = null!;

    public string? EthicsApprovalNumber { get; set; }

    public DateOnly? EthicsApprovalDate { get; set; }

    public DateOnly? EthicsExpiryDate { get; set; }

    public DateOnly? PlannedStartDate { get; set; }

    public DateOnly? PlannedEndDate { get; set; }

    public DateOnly? ActualStartDate { get; set; }

    public DateOnly? ActualEndDate { get; set; }

    public string? CurrentPhaseName { get; set; }

    public decimal ProgressPercent { get; set; }

    public string ProjectStatus { get; set; } = null!;

    public string HealthStatus { get; set; } = null!;

    public string RiskLevel { get; set; } = null!;

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

    public virtual Department? LeadDepartment { get; set; }

    public virtual User? PrincipalInvestigator { get; set; }

    public virtual ICollection<ProjectDeadline> ProjectDeadlines { get; set; } = new List<ProjectDeadline>();

    public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; } = new List<ProjectDocument>();

    public virtual ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();

    public virtual ICollection<ProjectMilestone> ProjectMilestones { get; set; } = new List<ProjectMilestone>();

    public virtual ICollection<ProjectPhase> ProjectPhases { get; set; } = new List<ProjectPhase>();

    public virtual Sponsor? Sponsor { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }
}
