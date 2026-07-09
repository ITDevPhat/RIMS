using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class SystemSetting
{
    public long SettingId { get; set; }

    public string SettingKey { get; set; } = null!;

    public string? SettingValue { get; set; }

    public string ValueType { get; set; } = null!;

    public string SettingGroup { get; set; } = null!;

    public string SettingName { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsPublic { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public byte[] RowVersion { get; set; } = null!;
}
