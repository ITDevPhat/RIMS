using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class Sponsor
{
    public long SponsorId { get; set; }

    public string SponsorCode { get; set; } = null!;

    public string SponsorName { get; set; } = null!;

    public string? SponsorType { get; set; }

    public string? ContactPerson { get; set; }

    public string? ContactEmail { get; set; }

    public string? ContactPhone { get; set; }

    public string? Address { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<ResearchProject> ResearchProjects { get; set; } = new List<ResearchProject>();

    public virtual User? UpdatedByNavigation { get; set; }
}
