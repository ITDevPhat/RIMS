using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class VResearchProjectOverview
{
    public long ProjectId { get; set; }

    public string ProjectCode { get; set; } = null!;

    public string ProjectTitle { get; set; } = null!;

    public string? LeadDepartmentName { get; set; }

    public string? PrincipalInvestigatorName { get; set; }

    public string? SponsorName { get; set; }

    public string? ProtocolNumber { get; set; }

    public string? ProtocolVersion { get; set; }

    public string EthicsStatus { get; set; } = null!;

    public DateOnly? EthicsExpiryDate { get; set; }

    public DateOnly? PlannedStartDate { get; set; }

    public DateOnly? PlannedEndDate { get; set; }

    public decimal ProgressPercent { get; set; }

    public string? CurrentPhaseName { get; set; }

    public string ProjectStatus { get; set; } = null!;

    public string HealthStatus { get; set; } = null!;

    public string RiskLevel { get; set; } = null!;

    public DateOnly? NextDueDate { get; set; }

    public string? NextDueTitle { get; set; }

    public int IsEthicsExpired { get; set; }

    public int IsEthicsExpiringSoon { get; set; }
}
