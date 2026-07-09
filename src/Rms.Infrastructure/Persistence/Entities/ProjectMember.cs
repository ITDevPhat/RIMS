using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ProjectMember
{
    public long ProjectMemberId { get; set; }

    public long ProjectId { get; set; }

    public long UserId { get; set; }

    public string MemberRole { get; set; } = null!;

    public string? Responsibility { get; set; }

    public DateOnly JoinedAt { get; set; }

    public DateOnly? LeftAt { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ResearchProject Project { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
