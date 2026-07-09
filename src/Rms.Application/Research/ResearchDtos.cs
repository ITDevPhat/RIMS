using System.ComponentModel.DataAnnotations;
using Rms.Application.Common;

namespace Rms.Application.Research;

public sealed class ResearchProjectQuery : PaginationQuery
{
    public long? DepartmentId { get; set; }
    public long? PrincipalInvestigatorId { get; set; }
    public long? SponsorId { get; set; }
    public string? Status { get; set; }
    public string? EthicsStatus { get; set; }
    public int? Year { get; set; }
    public string? RiskLevel { get; set; }
}

public sealed class ProjectPhaseQuery : PaginationQuery
{
    public long? ProjectId { get; set; }
    public string? Status { get; set; }
    public long? ResponsibleUserId { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public sealed class ProjectMilestoneQuery : PaginationQuery
{
    public long? ProjectId { get; set; }
    public long? PhaseId { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public long? ResponsibleUserId { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public sealed class ProjectDeadlineQuery : PaginationQuery
{
    public string? Type { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public int? DueInDays { get; set; }
    public bool? IsOverdue { get; set; }
}

public sealed record ResearchProjectDto(
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    string? Description,
    long? DepartmentId,
    string? DepartmentName,
    long? PrincipalInvestigatorId,
    string? PrincipalInvestigatorName,
    long? SponsorId,
    string? SponsorName,
    string? ResearchType,
    string? ProtocolNumber,
    string? ProtocolVersion,
    string EthicsStatus,
    DateOnly? EthicsApprovalDate,
    DateOnly? EthicsExpiryDate,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    string? CurrentPhaseName,
    decimal ProgressPercent,
    string ProjectStatus,
    string RiskLevel,
    DateOnly? NearestDeadlineDate,
    string? Notes);

public sealed record ResearchProjectOverviewDto(
    ResearchProjectDto Project,
    int PhaseCount,
    int MilestoneCount,
    int OpenDeadlineCount,
    DateOnly? NearestDeadlineDate);

public sealed record ProjectPhaseDto(
    long PhaseId,
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    string PhaseName,
    string? Description,
    long? ResponsibleUserId,
    string? ResponsibleUserName,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? DeadlineDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    decimal ProgressPercent,
    string PhaseStatus,
    string? Notes,
    int SortOrder);

public sealed record ProjectMilestoneDto(
    long MilestoneId,
    long ProjectId,
    string ProjectCode,
    string ProjectTitle,
    long? PhaseId,
    string? PhaseName,
    string MilestoneName,
    string? Description,
    DateOnly DueDate,
    long? ResponsibleUserId,
    string? ResponsibleUserName,
    string MilestoneStatus,
    string PriorityLevel,
    DateOnly? CompletedAt,
    string? Notes);

public sealed record ProjectDeadlineDto(
    long DeadlineId,
    long? ProjectId,
    string? ProjectCode,
    string? ProjectTitle,
    long? PhaseId,
    string? PhaseName,
    long? MilestoneId,
    string? MilestoneName,
    string DeadlineType,
    string Title,
    string? Description,
    DateOnly DueDate,
    long? ResponsibleUserId,
    string? ResponsibleUserName,
    string PriorityLevel,
    string DeadlineStatus,
    DateTime? CompletedAt,
    string? Notes,
    int DaysRemaining,
    bool IsOverdue,
    string SeverityLabel);

public sealed record SponsorDto(long SponsorId, string SponsorCode, string SponsorName, string? SponsorType, bool IsActive);

public sealed record ProjectMemberDto(long ProjectMemberId, long ProjectId, long UserId, string? FullName, string MemberRole, string? Responsibility, DateOnly JoinedAt, DateOnly? LeftAt, bool IsActive);

public sealed record ProjectDocumentDto(long DocumentId, long ProjectId, long? PhaseId, long? MilestoneId, string DocumentType, string DocumentTitle, string? FileName, string? FileUrl, long? FileSizeBytes, string? MimeType, string? VersionLabel, DateTime UploadedAt, long? UploadedBy);

public sealed record CreateResearchProjectRequest(
    [Required] string ProjectCode,
    [Required] string ProjectTitle,
    string? Description,
    long? DepartmentId,
    long? PrincipalInvestigatorId,
    long? SponsorId,
    string? SponsorName,
    string? ResearchType,
    string? ProtocolNumber,
    string? ProtocolVersion,
    string EthicsStatus,
    DateOnly? EthicsApprovalDate,
    DateOnly? EthicsExpiryDate,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    string? CurrentPhaseName,
    decimal ProgressPercent,
    string ProjectStatus,
    string RiskLevel,
    string? Notes);

public sealed record UpdateResearchProjectRequest(
    [Required] string ProjectTitle,
    string? Description,
    long? DepartmentId,
    long? PrincipalInvestigatorId,
    long? SponsorId,
    string? SponsorName,
    string? ResearchType,
    string? ProtocolNumber,
    string? ProtocolVersion,
    string EthicsStatus,
    DateOnly? EthicsApprovalDate,
    DateOnly? EthicsExpiryDate,
    DateOnly? PlannedStartDate,
    DateOnly? PlannedEndDate,
    DateOnly? ActualStartDate,
    DateOnly? ActualEndDate,
    string? CurrentPhaseName,
    decimal ProgressPercent,
    string ProjectStatus,
    string RiskLevel,
    string? Notes);

public sealed record CreateProjectPhaseRequest(long ProjectId, [Required] string PhaseName, string? Description, long? ResponsibleUserId, DateOnly? PlannedStartDate, DateOnly? PlannedEndDate, DateOnly? DeadlineDate, DateOnly? ActualStartDate, DateOnly? ActualEndDate, decimal ProgressPercent, string PhaseStatus, string? Notes, int SortOrder);
public sealed record UpdateProjectPhaseRequest([Required] string PhaseName, string? Description, long? ResponsibleUserId, DateOnly? PlannedStartDate, DateOnly? PlannedEndDate, DateOnly? DeadlineDate, DateOnly? ActualStartDate, DateOnly? ActualEndDate, decimal ProgressPercent, string PhaseStatus, string? Notes, int SortOrder);

public sealed record CreateProjectMilestoneRequest(long ProjectId, long? PhaseId, [Required] string MilestoneName, string? Description, DateOnly DueDate, long? ResponsibleUserId, string MilestoneStatus, string PriorityLevel, DateOnly? CompletedAt, string? Notes);
public sealed record UpdateProjectMilestoneRequest(long? PhaseId, [Required] string MilestoneName, string? Description, DateOnly DueDate, long? ResponsibleUserId, string MilestoneStatus, string PriorityLevel, DateOnly? CompletedAt, string? Notes);

public sealed record CreateProjectDeadlineRequest(long? ProjectId, long? PhaseId, long? MilestoneId, [Required] string DeadlineType, [Required] string Title, string? Description, DateOnly DueDate, long? ResponsibleUserId, string PriorityLevel, string DeadlineStatus);
public sealed record UpdateProjectDeadlineRequest(long? ProjectId, long? PhaseId, long? MilestoneId, [Required] string DeadlineType, [Required] string Title, string? Description, DateOnly DueDate, long? ResponsibleUserId, string PriorityLevel, string DeadlineStatus, DateTime? CompletedAt);

public sealed record CreateSponsorRequest([Required] string SponsorCode, [Required] string SponsorName, string? SponsorType, string? ContactPerson, string? ContactEmail, string? ContactPhone, string? Address, bool IsActive);
public sealed record UpdateSponsorRequest([Required] string SponsorName, string? SponsorType, string? ContactPerson, string? ContactEmail, string? ContactPhone, string? Address, bool IsActive);

public sealed record CreateProjectMemberRequest(long ProjectId, long UserId, [Required] string MemberRole, string? Responsibility, DateOnly JoinedAt, DateOnly? LeftAt, bool IsActive);
public sealed record UpdateProjectMemberRequest([Required] string MemberRole, string? Responsibility, DateOnly JoinedAt, DateOnly? LeftAt, bool IsActive);

public sealed record CreateProjectDocumentRequest(long ProjectId, long? PhaseId, long? MilestoneId, [Required] string DocumentType, [Required] string DocumentTitle, string? FileName, string? FileUrl, long? FileSizeBytes, string? MimeType, string? VersionLabel);
public sealed record UpdateProjectDocumentRequest(long? PhaseId, long? MilestoneId, [Required] string DocumentType, [Required] string DocumentTitle, string? FileName, string? FileUrl, long? FileSizeBytes, string? MimeType, string? VersionLabel, bool IsActive);
