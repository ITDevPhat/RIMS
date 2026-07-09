using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ProjectDocument
{
    public long DocumentId { get; set; }

    public long ProjectId { get; set; }

    public long? PhaseId { get; set; }

    public long? MilestoneId { get; set; }

    public string DocumentType { get; set; } = null!;

    public string DocumentTitle { get; set; } = null!;

    public string? FileName { get; set; }

    public string? FileUrl { get; set; }

    public long? FileSizeBytes { get; set; }

    public string? MimeType { get; set; }

    public string? VersionLabel { get; set; }

    public DateTime UploadedAt { get; set; }

    public long? UploadedBy { get; set; }

    public bool IsActive { get; set; }

    public virtual ProjectMilestone? Milestone { get; set; }

    public virtual ProjectPhase? Phase { get; set; }

    public virtual ResearchProject Project { get; set; } = null!;

    public virtual User? UploadedByNavigation { get; set; }
}
