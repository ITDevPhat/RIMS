using System;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class MasterDataItem
{
    public long MasterDataItemId { get; set; }

    public string CategoryCode { get; set; } = null!;

    public string ItemCode { get; set; } = null!;

    public string ItemName { get; set; } = null!;

    public string? Description { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;
}
