using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class NotificationTemplate
{
    public long TemplateId { get; set; }

    public string TemplateCode { get; set; } = null!;

    public string TemplateName { get; set; } = null!;

    public string NotificationType { get; set; } = null!;

    public string TitleTemplate { get; set; } = null!;

    public string BodyTemplate { get; set; } = null!;

    public string? EmailSubjectTemplate { get; set; }

    public string? EmailBodyTemplate { get; set; }

    public string DefaultPriority { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<NotificationRule> NotificationRules { get; set; } = new List<NotificationRule>();

    public virtual User? UpdatedByNavigation { get; set; }
}
