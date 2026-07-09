using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class Department
{
    public long DepartmentId { get; set; }

    public string DepartmentCode { get; set; } = null!;

    public string DepartmentName { get; set; } = null!;

    public long? ParentDepartmentId { get; set; }

    public string? DepartmentType { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public virtual ICollection<Department> InverseParentDepartment { get; set; } = new List<Department>();

    public virtual Department? ParentDepartment { get; set; }

    public virtual ICollection<ResearchProject> ResearchProjects { get; set; } = new List<ResearchProject>();

    public virtual ICollection<TrainingEventParticipant> TrainingEventParticipants { get; set; } = new List<TrainingEventParticipant>();

    public virtual ICollection<TrainingEvent> TrainingEvents { get; set; } = new List<TrainingEvent>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
