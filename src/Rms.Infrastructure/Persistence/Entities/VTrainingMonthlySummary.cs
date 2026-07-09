using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class VTrainingMonthlySummary
{
    public int EventYear { get; set; }

    public int EventMonth { get; set; }

    public int? PlannedCount { get; set; }

    public int? AdditionalCount { get; set; }

    public int? ActualCount { get; set; }

    public int? TotalPlanCount { get; set; }

    public int? NotCompletedCount { get; set; }

    public decimal? CompletionRate { get; set; }
}
