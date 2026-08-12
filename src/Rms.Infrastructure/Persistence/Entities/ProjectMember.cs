using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class ProjectMember
{
    public long ProjectMemberId { get; set; }

    public long ProjectId { get; set; }

    public long? UserId { get; set; }
    public string? MemberName { get; set; }
    public string? Email { get; set; }
    public long? DepartmentId { get; set; }
    public string? DepartmentNameText { get; set; }

    public string MemberRole { get; set; } = null!;

    public string? Responsibility { get; set; }

    public DateOnly JoinedAt { get; set; }

    public DateOnly? LeftAt { get; set; }

    public bool IsActive { get; set; }
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    public long RowVersion { get; set; } = 1;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ResearchProject Project { get; set; } = null!;

    public virtual User? User { get; set; }
    public virtual Department? Department { get; set; }
    public virtual User? UpdatedByNavigation { get; set; }
    public virtual User? DeletedByNavigation { get; set; }
}
