using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class Permission
{
    public long PermissionId { get; set; }

    public string ModuleCode { get; set; } = null!;

    public string ModuleName { get; set; } = null!;

    public string ActionCode { get; set; } = null!;

    public string ActionName { get; set; } = null!;

    public string? PermissionCode { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
