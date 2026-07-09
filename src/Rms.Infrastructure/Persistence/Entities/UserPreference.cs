using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class UserPreference
{
    public long PreferenceId { get; set; }

    public long UserId { get; set; }

    public string AppearanceMode { get; set; } = null!;

    public string LanguageCode { get; set; } = null!;

    public bool EnableInAppNotification { get; set; }

    public bool EnableEmailNotification { get; set; }

    public bool ReceiveDeadlineNotification { get; set; }

    public bool ReceiveTrainingNotification { get; set; }

    public bool ReceiveEthicsNotification { get; set; }

    public bool AutoMarkReadOnOpen { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
