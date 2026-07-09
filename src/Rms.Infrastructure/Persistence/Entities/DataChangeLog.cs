using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class DataChangeLog
{
    public long DataChangeLogId { get; set; }

    public DateTime OccurredAt { get; set; }

    public long? UserId { get; set; }

    public string TableSchema { get; set; } = null!;

    public string TableName { get; set; } = null!;

    public string PrimaryKeyValue { get; set; } = null!;

    public string ChangeType { get; set; } = null!;

    public string? OldValueJson { get; set; }

    public string? NewValueJson { get; set; }

    public string? RequestId { get; set; }

    public virtual User? User { get; set; }
}
