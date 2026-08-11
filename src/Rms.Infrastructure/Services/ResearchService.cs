using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Application.Research;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class ResearchService : IResearchService
{
    private const string ResearchTypeCategory = "research_type";
    private const string ProjectStatusCategory = "project_status";
    private const string EthicsStatusCategory = "ethics_status";
    private const string CurrentStageCategory = "current_stage";
    private const string RiskLevelCategory = "risk_level";

    private readonly RmsDbContext _dbContext;
    private readonly IAuditService _auditService;
    private readonly IUserContext _userContext;

    public ResearchService(RmsDbContext dbContext, IAuditService auditService, IUserContext userContext)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _userContext = userContext;
    }

    public async Task<PagedResult<ResearchProjectDto>> GetProjectsAsync(ResearchProjectQuery query, CancellationToken cancellationToken = default)
    {
        var projects = ProjectGraph().Where(x => x.DeletedAt == null);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            projects = projects.Where(x => x.ProjectCode.Contains(query.Search) || x.ProjectTitle.Contains(query.Search));
        }

        if (query.DepartmentId is not null) projects = projects.Where(x => x.LeadDepartmentId == query.DepartmentId);
        if (query.PrincipalInvestigatorId is not null) projects = projects.Where(x => x.PrincipalInvestigatorId == query.PrincipalInvestigatorId);
        if (query.SponsorId is not null) projects = projects.Where(x => x.SponsorId == query.SponsorId);
        if (!string.IsNullOrWhiteSpace(query.Status)) projects = projects.Where(x => x.ProjectStatus == query.Status);
        if (!string.IsNullOrWhiteSpace(query.EthicsStatus)) projects = projects.Where(x => x.EthicsStatus == query.EthicsStatus);
        if (!string.IsNullOrWhiteSpace(query.RiskLevel)) projects = projects.Where(x => x.RiskLevel == query.RiskLevel);
        if (query.Year is not null) projects = projects.Where(x => x.PlannedStartDate != null && x.PlannedStartDate.Value.Year == query.Year);

        var total = await projects.CountAsync(cancellationToken);
        var items = await projects.OrderByDescending(x => x.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);
        var masterNames = await GetMasterDataNamesAsync(cancellationToken);

        return PagedResult<ResearchProjectDto>.Create(items.Select(project => MapProject(project, masterNames)).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ResearchProjectDto> GetProjectAsync(long id, CancellationToken cancellationToken = default)
    {
        var project = await ProjectGraph().FirstOrDefaultAsync(x => x.ProjectId == id && x.DeletedAt == null, cancellationToken);
        if (project is null) throw new NotFoundException("Research project not found.");
        var masterNames = await GetMasterDataNamesAsync(cancellationToken);
        return MapProject(project, masterNames);
    }

    public async Task<ResearchProjectOverviewDto> GetProjectOverviewAsync(long id, CancellationToken cancellationToken = default)
    {
        var project = await ProjectGraph()
            .AsSplitQuery()
            .Include(x => x.ProjectPhases)
            .Include(x => x.ProjectMilestones)
            .FirstOrDefaultAsync(x => x.ProjectId == id && x.DeletedAt == null, cancellationToken);
        if (project is null) throw new NotFoundException("Research project not found.");

        var openDeadlines = project.ProjectDeadlines.Where(x => x.DeletedAt == null && x.DeadlineStatus != "completed").ToList();
        return new ResearchProjectOverviewDto(
            MapProject(project, await GetMasterDataNamesAsync(cancellationToken)),
            project.ProjectPhases.Count(x => x.DeletedAt == null),
            project.ProjectMilestones.Count(x => x.DeletedAt == null),
            openDeadlines.Count,
            openDeadlines.OrderBy(x => x.DueDate).FirstOrDefault()?.DueDate);
    }

    public async Task<ResearchProjectDto> CreateProjectAsync(CreateResearchProjectRequest request, CancellationToken cancellationToken = default)
    {
        ValidateProgress(request.ProgressPercent);
        ValidateDateRange(request.PlannedStartDate, request.PlannedEndDate);
        var plannedStartDatePrecision = NormalizeDatePrecision(request.PlannedStartDatePrecision);
        var plannedEndDatePrecision = NormalizeDatePrecision(request.PlannedEndDatePrecision);
        var actualStartDatePrecision = NormalizeDatePrecision(request.ActualStartDatePrecision);
        var actualEndDatePrecision = NormalizeDatePrecision(request.ActualEndDatePrecision);
        await ValidateSponsorAsync(request.SponsorId, null, cancellationToken);
        await ValidateMasterDataValueAsync(ResearchTypeCategory, request.ResearchType, null, "Loại nghiên cứu không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(EthicsStatusCategory, request.EthicsStatus, null, "Trạng thái phê duyệt đạo đức không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(ProjectStatusCategory, request.ProjectStatus, null, "Trạng thái đề tài không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(CurrentStageCategory, request.CurrentPhaseName, null, "Giai đoạn hiện tại không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(RiskLevelCategory, request.RiskLevel, null, "Mức độ rủi ro không hợp lệ.", cancellationToken);
        if (await _dbContext.ResearchProjects.AnyAsync(x => x.ProjectCode == request.ProjectCode, cancellationToken))
        {
            throw new InvalidOperationException("Project code already exists.");
        }

        var project = new ResearchProject
        {
            ProjectCode = request.ProjectCode.Trim(),
            ProjectTitle = request.ProjectTitle.Trim(),
            ProjectDescription = request.Description,
            LeadDepartmentId = request.DepartmentId,
            PrincipalInvestigatorId = request.PrincipalInvestigatorId,
            SponsorId = request.SponsorId,
            SponsorNameText = request.SponsorName,
            ResearchType = request.ResearchType,
            ProtocolNumber = request.ProtocolNumber,
            ProtocolVersion = request.ProtocolVersion,
            EthicsStatus = string.IsNullOrWhiteSpace(request.EthicsStatus) ? "not_required" : request.EthicsStatus,
            EthicsApprovalDate = request.EthicsApprovalDate,
            EthicsExpiryDate = request.EthicsExpiryDate,
            PlannedStartDate = NormalizeDateValue(request.PlannedStartDate, plannedStartDatePrecision),
            PlannedStartDatePrecision = plannedStartDatePrecision,
            PlannedEndDate = NormalizeDateValue(request.PlannedEndDate, plannedEndDatePrecision),
            PlannedEndDatePrecision = plannedEndDatePrecision,
            ActualStartDate = NormalizeDateValue(request.ActualStartDate, actualStartDatePrecision),
            ActualStartDatePrecision = actualStartDatePrecision,
            ActualEndDate = NormalizeDateValue(request.ActualEndDate, actualEndDatePrecision),
            ActualEndDatePrecision = actualEndDatePrecision,
            CurrentPhaseName = request.CurrentPhaseName,
            ProgressPercent = request.ProgressPercent,
            ProjectStatus = string.IsNullOrWhiteSpace(request.ProjectStatus) ? "not_started" : request.ProjectStatus,
            HealthStatus = "on_track",
            RiskLevel = string.IsNullOrWhiteSpace(request.RiskLevel) ? "low" : request.RiskLevel,
            PriorityLevel = "normal",
            Notes = request.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };

        _dbContext.ResearchProjects.Add(project);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "create", $"Created research project {project.ProjectCode}", "ResearchProject", project.ProjectId, project.ProjectCode, cancellationToken: cancellationToken);
        return await GetProjectAsync(project.ProjectId, cancellationToken);
    }

    public async Task<ResearchProjectDto> UpdateProjectAsync(long id, UpdateResearchProjectRequest request, CancellationToken cancellationToken = default)
    {
        ValidateProgress(request.ProgressPercent);
        ValidateDateRange(request.PlannedStartDate, request.PlannedEndDate);
        var plannedStartDatePrecision = NormalizeDatePrecision(request.PlannedStartDatePrecision);
        var plannedEndDatePrecision = NormalizeDatePrecision(request.PlannedEndDatePrecision);
        var actualStartDatePrecision = NormalizeDatePrecision(request.ActualStartDatePrecision);
        var actualEndDatePrecision = NormalizeDatePrecision(request.ActualEndDatePrecision);
        var project = await _dbContext.ResearchProjects.FirstOrDefaultAsync(x => x.ProjectId == id && x.DeletedAt == null, cancellationToken);
        if (project is null) throw new NotFoundException("Research project not found.");
        await ValidateSponsorAsync(request.SponsorId, project.SponsorId, cancellationToken);
        await ValidateMasterDataValueAsync(ResearchTypeCategory, request.ResearchType, project.ResearchType, "Loại nghiên cứu không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(EthicsStatusCategory, request.EthicsStatus, project.EthicsStatus, "Trạng thái phê duyệt đạo đức không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(ProjectStatusCategory, request.ProjectStatus, project.ProjectStatus, "Trạng thái đề tài không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(CurrentStageCategory, request.CurrentPhaseName, project.CurrentPhaseName, "Giai đoạn hiện tại không hợp lệ.", cancellationToken);
        await ValidateMasterDataValueAsync(RiskLevelCategory, request.RiskLevel, project.RiskLevel, "Mức độ rủi ro không hợp lệ.", cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.ProjectCode))
        {
            var projectCode = request.ProjectCode.Trim();
            var exists = await _dbContext.ResearchProjects.AnyAsync(x => x.ProjectId != id && x.ProjectCode == projectCode && x.DeletedAt == null, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException("Project code already exists.");
            }

            project.ProjectCode = projectCode;
        }

        project.ProjectTitle = request.ProjectTitle.Trim();
        project.ProjectDescription = request.Description;
        project.LeadDepartmentId = request.DepartmentId;
        project.PrincipalInvestigatorId = request.PrincipalInvestigatorId;
        project.SponsorId = request.SponsorId;
        project.SponsorNameText = request.SponsorName;
        project.ResearchType = request.ResearchType;
        project.ProtocolNumber = request.ProtocolNumber;
        project.ProtocolVersion = request.ProtocolVersion;
        project.EthicsStatus = request.EthicsStatus;
        project.EthicsApprovalDate = request.EthicsApprovalDate;
        project.EthicsExpiryDate = request.EthicsExpiryDate;
        project.PlannedStartDate = NormalizeDateValue(request.PlannedStartDate, plannedStartDatePrecision);
        project.PlannedStartDatePrecision = plannedStartDatePrecision;
        project.PlannedEndDate = NormalizeDateValue(request.PlannedEndDate, plannedEndDatePrecision);
        project.PlannedEndDatePrecision = plannedEndDatePrecision;
        project.ActualStartDate = NormalizeDateValue(request.ActualStartDate, actualStartDatePrecision);
        project.ActualStartDatePrecision = actualStartDatePrecision;
        project.ActualEndDate = NormalizeDateValue(request.ActualEndDate, actualEndDatePrecision);
        project.ActualEndDatePrecision = actualEndDatePrecision;
        project.CurrentPhaseName = request.CurrentPhaseName;
        project.ProgressPercent = request.ProgressPercent;
        project.ProjectStatus = request.ProjectStatus;
        project.RiskLevel = request.RiskLevel;
        project.Notes = request.Notes;
        project.UpdatedAt = DateTime.UtcNow;
        project.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "update", $"Updated research project {project.ProjectCode}", "ResearchProject", project.ProjectId, project.ProjectCode, cancellationToken: cancellationToken);
        return await GetProjectAsync(project.ProjectId, cancellationToken);
    }

    public async Task DeleteProjectAsync(long id, CancellationToken cancellationToken = default)
    {
        var project = await _dbContext.ResearchProjects.FirstOrDefaultAsync(x => x.ProjectId == id && x.DeletedAt == null, cancellationToken);
        if (project is null) throw new NotFoundException("Research project not found.");
        project.DeletedAt = DateTime.UtcNow;
        project.DeletedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "delete", $"Deleted research project {project.ProjectCode}", "ResearchProject", project.ProjectId, project.ProjectCode, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<ProjectPhaseDto>> GetPhasesAsync(ProjectPhaseQuery query, CancellationToken cancellationToken = default)
    {
        var phases = PhaseGraph().Where(x => x.DeletedAt == null);
        if (query.ProjectId is not null) phases = phases.Where(x => x.ProjectId == query.ProjectId);
        if (!string.IsNullOrWhiteSpace(query.Status)) phases = phases.Where(x => x.PhaseStatus == query.Status);
        if (query.ResponsibleUserId is not null) phases = phases.Where(x => x.OwnerUserId == query.ResponsibleUserId);
        if (query.FromDate is not null) phases = phases.Where(x => x.DeadlineDate >= query.FromDate || x.PlannedStartDate >= query.FromDate);
        if (query.ToDate is not null) phases = phases.Where(x => x.DeadlineDate <= query.ToDate || x.PlannedEndDate <= query.ToDate);
        if (!string.IsNullOrWhiteSpace(query.Search)) phases = phases.Where(x => x.PhaseName.Contains(query.Search));
        var total = await phases.CountAsync(cancellationToken);
        var items = await phases.OrderBy(x => x.SortOrder).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<ProjectPhaseDto>.Create(items.Select(MapPhase).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectPhaseDto> GetPhaseAsync(long id, CancellationToken cancellationToken = default)
    {
        var phase = await PhaseGraph().FirstOrDefaultAsync(x => x.PhaseId == id && x.DeletedAt == null, cancellationToken);
        return phase is null ? throw new NotFoundException("Project phase not found.") : MapPhase(phase);
    }

    public async Task<ProjectPhaseDto> CreatePhaseAsync(CreateProjectPhaseRequest request, CancellationToken cancellationToken = default)
    {
        ValidateProgress(request.ProgressPercent);
        ValidateDateRange(request.PlannedStartDate, request.PlannedEndDate);
        var plannedStartDatePrecision = NormalizeDatePrecision(request.PlannedStartDatePrecision);
        var plannedEndDatePrecision = NormalizeDatePrecision(request.PlannedEndDatePrecision);
        var deadlineDatePrecision = NormalizeDatePrecision(request.DeadlineDatePrecision);
        var actualStartDatePrecision = NormalizeDatePrecision(request.ActualStartDatePrecision);
        var actualEndDatePrecision = NormalizeDatePrecision(request.ActualEndDatePrecision);
        var phase = new ProjectPhase
        {
            ProjectId = request.ProjectId,
            PhaseName = request.PhaseName,
            PhaseDescription = request.Description,
            OwnerUserId = request.ResponsibleUserId,
            PlannedStartDate = NormalizeDateValue(request.PlannedStartDate, plannedStartDatePrecision),
            PlannedStartDatePrecision = plannedStartDatePrecision,
            PlannedEndDate = NormalizeDateValue(request.PlannedEndDate, plannedEndDatePrecision),
            PlannedEndDatePrecision = plannedEndDatePrecision,
            DeadlineDate = NormalizeDateValue(request.DeadlineDate, deadlineDatePrecision),
            DeadlineDatePrecision = deadlineDatePrecision,
            ActualStartDate = NormalizeDateValue(request.ActualStartDate, actualStartDatePrecision),
            ActualStartDatePrecision = actualStartDatePrecision,
            ActualEndDate = NormalizeDateValue(request.ActualEndDate, actualEndDatePrecision),
            ActualEndDatePrecision = actualEndDatePrecision,
            ProgressPercent = request.ProgressPercent,
            PhaseStatus = string.IsNullOrWhiteSpace(request.PhaseStatus) ? "not_started" : request.PhaseStatus,
            Notes = request.Notes,
            SortOrder = request.SortOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };
        _dbContext.ProjectPhases.Add(phase);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateProjectProgressAsync(phase.ProjectId, cancellationToken);
        await _auditService.WriteActivityAsync("project_phase", "create", $"Created phase {phase.PhaseName}", "ProjectPhase", phase.PhaseId, cancellationToken: cancellationToken);
        return await GetPhaseAsync(phase.PhaseId, cancellationToken);
    }

    public async Task<ProjectPhaseDto> UpdatePhaseAsync(long id, UpdateProjectPhaseRequest request, CancellationToken cancellationToken = default)
    {
        ValidateProgress(request.ProgressPercent);
        ValidateDateRange(request.PlannedStartDate, request.PlannedEndDate);
        var plannedStartDatePrecision = NormalizeDatePrecision(request.PlannedStartDatePrecision);
        var plannedEndDatePrecision = NormalizeDatePrecision(request.PlannedEndDatePrecision);
        var deadlineDatePrecision = NormalizeDatePrecision(request.DeadlineDatePrecision);
        var actualStartDatePrecision = NormalizeDatePrecision(request.ActualStartDatePrecision);
        var actualEndDatePrecision = NormalizeDatePrecision(request.ActualEndDatePrecision);
        var phase = await _dbContext.ProjectPhases.FirstOrDefaultAsync(x => x.PhaseId == id && x.DeletedAt == null, cancellationToken);
        if (phase is null) throw new NotFoundException("Project phase not found.");
        phase.PhaseName = request.PhaseName;
        phase.PhaseDescription = request.Description;
        phase.OwnerUserId = request.ResponsibleUserId;
        phase.PlannedStartDate = NormalizeDateValue(request.PlannedStartDate, plannedStartDatePrecision);
        phase.PlannedStartDatePrecision = plannedStartDatePrecision;
        phase.PlannedEndDate = NormalizeDateValue(request.PlannedEndDate, plannedEndDatePrecision);
        phase.PlannedEndDatePrecision = plannedEndDatePrecision;
        phase.DeadlineDate = NormalizeDateValue(request.DeadlineDate, deadlineDatePrecision);
        phase.DeadlineDatePrecision = deadlineDatePrecision;
        phase.ActualStartDate = NormalizeDateValue(request.ActualStartDate, actualStartDatePrecision);
        phase.ActualStartDatePrecision = actualStartDatePrecision;
        phase.ActualEndDate = NormalizeDateValue(request.ActualEndDate, actualEndDatePrecision);
        phase.ActualEndDatePrecision = actualEndDatePrecision;
        phase.ProgressPercent = request.ProgressPercent;
        phase.PhaseStatus = request.PhaseStatus;
        phase.Notes = request.Notes;
        phase.SortOrder = request.SortOrder;
        phase.UpdatedAt = DateTime.UtcNow;
        phase.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateProjectProgressAsync(phase.ProjectId, cancellationToken);
        await _auditService.WriteActivityAsync("project_phase", "update", $"Updated phase {phase.PhaseName}", "ProjectPhase", phase.PhaseId, cancellationToken: cancellationToken);
        return await GetPhaseAsync(phase.PhaseId, cancellationToken);
    }

    public async Task DeletePhaseAsync(long id, CancellationToken cancellationToken = default)
    {
        var phase = await _dbContext.ProjectPhases.FirstOrDefaultAsync(x => x.PhaseId == id && x.DeletedAt == null, cancellationToken);
        if (phase is null) throw new NotFoundException("Project phase not found.");
        phase.DeletedAt = DateTime.UtcNow;
        phase.DeletedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateProjectProgressAsync(phase.ProjectId, cancellationToken);
        await _auditService.WriteActivityAsync("project_phase", "delete", $"Deleted phase {phase.PhaseName}", "ProjectPhase", phase.PhaseId, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<ProjectMilestoneDto>> GetMilestonesAsync(ProjectMilestoneQuery query, CancellationToken cancellationToken = default)
    {
        var milestones = MilestoneGraph().Where(x => x.DeletedAt == null);
        if (query.ProjectId is not null) milestones = milestones.Where(x => x.ProjectId == query.ProjectId);
        if (query.PhaseId is not null) milestones = milestones.Where(x => x.PhaseId == query.PhaseId);
        if (!string.IsNullOrWhiteSpace(query.Status)) milestones = milestones.Where(x => x.MilestoneStatus == query.Status);
        if (!string.IsNullOrWhiteSpace(query.Priority)) milestones = milestones.Where(x => x.PriorityLevel == query.Priority);
        if (query.ResponsibleUserId is not null) milestones = milestones.Where(x => x.OwnerUserId == query.ResponsibleUserId);
        if (query.FromDate is not null) milestones = milestones.Where(x => x.DueDate >= query.FromDate);
        if (query.ToDate is not null) milestones = milestones.Where(x => x.DueDate <= query.ToDate);
        if (!string.IsNullOrWhiteSpace(query.Search)) milestones = milestones.Where(x => x.MilestoneName.Contains(query.Search));
        var total = await milestones.CountAsync(cancellationToken);
        var items = await milestones.OrderBy(x => x.DueDate).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        var masterNames = await GetMasterDataNamesAsync(cancellationToken);
        return PagedResult<ProjectMilestoneDto>.Create(items.Select(item => MapMilestone(item, masterNames)).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectMilestoneDto> GetMilestoneAsync(long id, CancellationToken cancellationToken = default)
    {
        var milestone = await MilestoneGraph().FirstOrDefaultAsync(x => x.MilestoneId == id && x.DeletedAt == null, cancellationToken);
        if (milestone is null) throw new NotFoundException("Project milestone not found.");
        var masterNames = await GetMasterDataNamesAsync(cancellationToken);
        return MapMilestone(milestone, masterNames);
    }

    public async Task<ProjectMilestoneDto> CreateMilestoneAsync(CreateProjectMilestoneRequest request, CancellationToken cancellationToken = default)
    {
        var dueDatePrecision = NormalizeDatePrecision(request.DueDatePrecision);
        var completedAtPrecision = NormalizeDatePrecision(request.CompletedAtPrecision);
        await ValidateMasterDataValueAsync(RiskLevelCategory, request.PriorityLevel, null, "Mức độ rủi ro không hợp lệ.", cancellationToken);
        var milestone = new ProjectMilestone
        {
            ProjectId = request.ProjectId,
            PhaseId = request.PhaseId,
            MilestoneName = request.MilestoneName,
            MilestoneDescription = request.Description,
            DueDate = NormalizeRequiredDateValue(request.DueDate, dueDatePrecision),
            DueDatePrecision = dueDatePrecision,
            OwnerUserId = request.ResponsibleUserId,
            MilestoneStatus = string.IsNullOrWhiteSpace(request.MilestoneStatus) ? "not_started" : request.MilestoneStatus,
            PriorityLevel = string.IsNullOrWhiteSpace(request.PriorityLevel) ? "normal" : request.PriorityLevel,
            CompletedDate = NormalizeDateValue(request.CompletedAt, completedAtPrecision),
            CompletedDatePrecision = completedAtPrecision,
            Notes = request.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };
        _dbContext.ProjectMilestones.Add(milestone);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_milestone", "create", $"Created milestone {milestone.MilestoneName}", "ProjectMilestone", milestone.MilestoneId, cancellationToken: cancellationToken);
        return await GetMilestoneAsync(milestone.MilestoneId, cancellationToken);
    }

    public async Task<ProjectMilestoneDto> UpdateMilestoneAsync(long id, UpdateProjectMilestoneRequest request, CancellationToken cancellationToken = default)
    {
        var dueDatePrecision = NormalizeDatePrecision(request.DueDatePrecision);
        var completedAtPrecision = NormalizeDatePrecision(request.CompletedAtPrecision);
        var milestone = await _dbContext.ProjectMilestones.FirstOrDefaultAsync(x => x.MilestoneId == id && x.DeletedAt == null, cancellationToken);
        if (milestone is null) throw new NotFoundException("Project milestone not found.");
        await ValidateMasterDataValueAsync(RiskLevelCategory, request.PriorityLevel, milestone.PriorityLevel, "Mức độ rủi ro không hợp lệ.", cancellationToken);
        milestone.PhaseId = request.PhaseId;
        milestone.MilestoneName = request.MilestoneName;
        milestone.MilestoneDescription = request.Description;
        milestone.DueDate = NormalizeRequiredDateValue(request.DueDate, dueDatePrecision);
        milestone.DueDatePrecision = dueDatePrecision;
        milestone.OwnerUserId = request.ResponsibleUserId;
        milestone.MilestoneStatus = request.MilestoneStatus;
        milestone.PriorityLevel = request.PriorityLevel;
        milestone.CompletedDate = NormalizeDateValue(request.CompletedAt, completedAtPrecision);
        milestone.CompletedDatePrecision = completedAtPrecision;
        milestone.Notes = request.Notes;
        milestone.UpdatedAt = DateTime.UtcNow;
        milestone.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_milestone", "update", $"Updated milestone {milestone.MilestoneName}", "ProjectMilestone", milestone.MilestoneId, cancellationToken: cancellationToken);
        return await GetMilestoneAsync(milestone.MilestoneId, cancellationToken);
    }

    public async Task DeleteMilestoneAsync(long id, CancellationToken cancellationToken = default)
    {
        var milestone = await _dbContext.ProjectMilestones.FirstOrDefaultAsync(x => x.MilestoneId == id && x.DeletedAt == null, cancellationToken);
        if (milestone is null) throw new NotFoundException("Project milestone not found.");
        milestone.DeletedAt = DateTime.UtcNow;
        milestone.DeletedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_milestone", "delete", $"Deleted milestone {milestone.MilestoneName}", "ProjectMilestone", milestone.MilestoneId, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<ProjectDeadlineDto>> GetDeadlinesAsync(ProjectDeadlineQuery query, CancellationToken cancellationToken = default)
    {
        var deadlines = DeadlineGraph().Where(x => x.DeletedAt == null);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (query.ProjectId is not null) deadlines = deadlines.Where(x => x.ProjectId == query.ProjectId);
        if (query.PhaseId is not null) deadlines = deadlines.Where(x => x.PhaseId == query.PhaseId);
        if (query.MilestoneId is not null) deadlines = deadlines.Where(x => x.MilestoneId == query.MilestoneId);
        if (!string.IsNullOrWhiteSpace(query.Type)) deadlines = deadlines.Where(x => x.DeadlineType == query.Type);
        if (!string.IsNullOrWhiteSpace(query.Status)) deadlines = deadlines.Where(x => x.DeadlineStatus == query.Status);
        if (!string.IsNullOrWhiteSpace(query.Priority)) deadlines = deadlines.Where(x => x.PriorityLevel == query.Priority);
        if (query.FromDate is not null) deadlines = deadlines.Where(x => x.DueDate >= query.FromDate);
        if (query.ToDate is not null) deadlines = deadlines.Where(x => x.DueDate <= query.ToDate);
        if (query.DueInDays is not null) deadlines = deadlines.Where(x => x.DueDate <= today.AddDays(query.DueInDays.Value));
        if (query.IsOverdue == true) deadlines = deadlines.Where(x => x.DueDate < today && x.DeadlineStatus != "completed");
        if (!string.IsNullOrWhiteSpace(query.Search)) deadlines = deadlines.Where(x => x.DeadlineTitle.Contains(query.Search));
        var total = await deadlines.CountAsync(cancellationToken);
        var items = await deadlines.OrderBy(x => x.DueDate).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<ProjectDeadlineDto>.Create(items.Select(MapDeadline).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectDeadlineDto> GetDeadlineAsync(long id, CancellationToken cancellationToken = default)
    {
        var deadline = await DeadlineGraph().FirstOrDefaultAsync(x => x.DeadlineId == id && x.DeletedAt == null, cancellationToken);
        return deadline is null ? throw new NotFoundException("Project deadline not found.") : MapDeadline(deadline);
    }

    public async Task<ProjectDeadlineDto> CreateDeadlineAsync(CreateProjectDeadlineRequest request, CancellationToken cancellationToken = default)
    {
        var dueDatePrecision = NormalizeDatePrecision(request.DueDatePrecision);
        var deadline = new ProjectDeadline
        {
            ProjectId = request.ProjectId,
            PhaseId = request.PhaseId,
            MilestoneId = request.MilestoneId,
            DeadlineType = request.DeadlineType,
            DeadlineTitle = request.Title,
            DeadlineDescription = request.Description,
            DueDate = NormalizeRequiredDateValue(request.DueDate, dueDatePrecision),
            DueDatePrecision = dueDatePrecision,
            ResponsibleUserId = request.ResponsibleUserId,
            PriorityLevel = string.IsNullOrWhiteSpace(request.PriorityLevel) ? "normal" : request.PriorityLevel,
            DeadlineStatus = string.IsNullOrWhiteSpace(request.DeadlineStatus) ? "open" : request.DeadlineStatus,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _userContext.User?.UserId
        };
        _dbContext.ProjectDeadlines.Add(deadline);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_deadline", "create", $"Created deadline {deadline.DeadlineTitle}", "ProjectDeadline", deadline.DeadlineId, cancellationToken: cancellationToken);
        return await GetDeadlineAsync(deadline.DeadlineId, cancellationToken);
    }

    public async Task<ProjectDeadlineDto> UpdateDeadlineAsync(long id, UpdateProjectDeadlineRequest request, CancellationToken cancellationToken = default)
    {
        var dueDatePrecision = NormalizeDatePrecision(request.DueDatePrecision);
        var deadline = await _dbContext.ProjectDeadlines.FirstOrDefaultAsync(x => x.DeadlineId == id && x.DeletedAt == null, cancellationToken);
        if (deadline is null) throw new NotFoundException("Project deadline not found.");
        deadline.ProjectId = request.ProjectId;
        deadline.PhaseId = request.PhaseId;
        deadline.MilestoneId = request.MilestoneId;
        deadline.DeadlineType = request.DeadlineType;
        deadline.DeadlineTitle = request.Title;
        deadline.DeadlineDescription = request.Description;
        deadline.DueDate = NormalizeRequiredDateValue(request.DueDate, dueDatePrecision);
        deadline.DueDatePrecision = dueDatePrecision;
        deadline.ResponsibleUserId = request.ResponsibleUserId;
        deadline.PriorityLevel = request.PriorityLevel;
        deadline.DeadlineStatus = request.DeadlineStatus;
        deadline.CompletedAt = request.CompletedAt;
        deadline.UpdatedAt = DateTime.UtcNow;
        deadline.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_deadline", "update", $"Updated deadline {deadline.DeadlineTitle}", "ProjectDeadline", deadline.DeadlineId, cancellationToken: cancellationToken);
        return await GetDeadlineAsync(deadline.DeadlineId, cancellationToken);
    }

    public async Task DeleteDeadlineAsync(long id, CancellationToken cancellationToken = default)
    {
        var deadline = await _dbContext.ProjectDeadlines.FirstOrDefaultAsync(x => x.DeadlineId == id && x.DeletedAt == null, cancellationToken);
        if (deadline is null) throw new NotFoundException("Project deadline not found.");
        deadline.DeletedAt = DateTime.UtcNow;
        deadline.DeletedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_deadline", "delete", $"Deleted deadline {deadline.DeadlineTitle}", "ProjectDeadline", deadline.DeadlineId, cancellationToken: cancellationToken);
    }

    public async Task<ProjectDeadlineDto> MarkDeadlineCompletedAsync(long id, CancellationToken cancellationToken = default)
    {
        var deadline = await _dbContext.ProjectDeadlines.FirstOrDefaultAsync(x => x.DeadlineId == id && x.DeletedAt == null, cancellationToken);
        if (deadline is null) throw new NotFoundException("Project deadline not found.");
        deadline.DeadlineStatus = "completed";
        deadline.CompletedAt = DateTime.UtcNow;
        deadline.UpdatedAt = DateTime.UtcNow;
        deadline.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("project_deadline", "update", $"Completed deadline {deadline.DeadlineTitle}", "ProjectDeadline", deadline.DeadlineId, cancellationToken: cancellationToken);
        return await GetDeadlineAsync(id, cancellationToken);
    }

    public async Task<PagedResult<SponsorDto>> GetSponsorsAsync(SponsorQuery query, CancellationToken cancellationToken = default)
    {
        var sponsors = _dbContext.Sponsors.Where(x => x.DeletedAt == null);
        if (!string.IsNullOrWhiteSpace(query.Search)) sponsors = sponsors.Where(x => x.SponsorCode.Contains(query.Search) || x.SponsorName.Contains(query.Search));
        if (query.IsActive is not null) sponsors = sponsors.Where(x => x.IsActive == query.IsActive.Value);
        var total = await sponsors.CountAsync(cancellationToken);
        var items = await sponsors.OrderBy(x => x.SponsorName).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<SponsorDto>.Create(items.Select(MapSponsor).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<SponsorDto> CreateSponsorAsync(CreateSponsorRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.SponsorCode.Trim();
        var name = request.SponsorName.Trim();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Mã và tên nhà tài trợ không được rỗng.");
        var exists = await _dbContext.Sponsors.AnyAsync(x => x.DeletedAt == null && (x.SponsorCode.ToUpper() == code.ToUpper() || x.SponsorName.ToUpper() == name.ToUpper()), cancellationToken);
        if (exists) throw new InvalidOperationException("Mã hoặc tên nhà tài trợ đã tồn tại.");
        var sponsor = new Sponsor { SponsorCode = code, SponsorName = name, SponsorType = request.SponsorType, ContactPerson = request.ContactPerson, ContactEmail = request.ContactEmail, ContactPhone = request.ContactPhone, Address = request.Address, IsActive = request.IsActive, CreatedAt = DateTime.UtcNow, CreatedBy = _userContext.User?.UserId };
        _dbContext.Sponsors.Add(sponsor);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "create", $"Created sponsor {sponsor.SponsorCode}", "Sponsor", sponsor.SponsorId, sponsor.SponsorCode, cancellationToken: cancellationToken);
        return MapSponsor(sponsor);
    }

    public async Task<SponsorDto> UpdateSponsorAsync(long id, UpdateSponsorRequest request, CancellationToken cancellationToken = default)
    {
        var sponsor = await _dbContext.Sponsors.FirstOrDefaultAsync(x => x.SponsorId == id && x.DeletedAt == null, cancellationToken);
        if (sponsor is null) throw new NotFoundException("Sponsor not found.");
        var name = request.SponsorName.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Tên nhà tài trợ không được rỗng.");
        var duplicateName = await _dbContext.Sponsors.AnyAsync(x => x.SponsorId != id && x.DeletedAt == null && x.SponsorName.ToUpper() == name.ToUpper(), cancellationToken);
        if (duplicateName) throw new InvalidOperationException("Tên nhà tài trợ đã tồn tại.");
        sponsor.SponsorName = name;
        sponsor.SponsorType = request.SponsorType;
        sponsor.ContactPerson = request.ContactPerson;
        sponsor.ContactEmail = request.ContactEmail;
        sponsor.ContactPhone = request.ContactPhone;
        sponsor.Address = request.Address;
        sponsor.IsActive = request.IsActive;
        sponsor.UpdatedAt = DateTime.UtcNow;
        sponsor.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "update", $"Updated sponsor {sponsor.SponsorCode}", "Sponsor", sponsor.SponsorId, sponsor.SponsorCode, cancellationToken: cancellationToken);
        return MapSponsor(sponsor);
    }

    public async Task DeleteSponsorAsync(long id, CancellationToken cancellationToken = default)
    {
        var sponsor = await _dbContext.Sponsors.FirstOrDefaultAsync(x => x.SponsorId == id && x.DeletedAt == null, cancellationToken);
        if (sponsor is null) throw new NotFoundException("Sponsor not found.");
        sponsor.IsActive = false;
        sponsor.UpdatedAt = DateTime.UtcNow;
        sponsor.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "delete", $"Deleted sponsor {sponsor.SponsorCode}", "Sponsor", sponsor.SponsorId, sponsor.SponsorCode, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<ProjectMemberDto>> GetMembersAsync(PaginationQuery query, long? projectId = null, CancellationToken cancellationToken = default)
    {
        var members = _dbContext.ProjectMembers.Include(x => x.User).AsQueryable();
        if (projectId is not null) members = members.Where(x => x.ProjectId == projectId);
        if (!string.IsNullOrWhiteSpace(query.Search)) members = members.Where(x => x.User.FullName.Contains(query.Search) || x.MemberRole.Contains(query.Search));
        var total = await members.CountAsync(cancellationToken);
        var items = await members.OrderBy(x => x.ProjectMemberId).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<ProjectMemberDto>.Create(items.Select(MapMember).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectMemberDto> CreateMemberAsync(CreateProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        var member = new ProjectMember { ProjectId = request.ProjectId, UserId = request.UserId, MemberRole = request.MemberRole, Responsibility = request.Responsibility, JoinedAt = request.JoinedAt, LeftAt = request.LeftAt, IsActive = request.IsActive, CreatedAt = DateTime.UtcNow, CreatedBy = _userContext.User?.UserId };
        _dbContext.ProjectMembers.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "create", $"Created project member {member.UserId}", "ProjectMember", member.ProjectMemberId, cancellationToken: cancellationToken);
        var created = await _dbContext.ProjectMembers
            .Include(x => x.User)
            .FirstAsync(x => x.ProjectMemberId == member.ProjectMemberId, cancellationToken);
        return MapMember(created);
    }

    public async Task<ProjectMemberDto> UpdateMemberAsync(long id, UpdateProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        var member = await _dbContext.ProjectMembers.Include(x => x.User).FirstOrDefaultAsync(x => x.ProjectMemberId == id, cancellationToken);
        if (member is null) throw new NotFoundException("Project member not found.");
        member.MemberRole = request.MemberRole;
        member.Responsibility = request.Responsibility;
        member.JoinedAt = request.JoinedAt;
        member.LeftAt = request.LeftAt;
        member.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "update", $"Updated project member {member.UserId}", "ProjectMember", member.ProjectMemberId, cancellationToken: cancellationToken);
        return MapMember(member);
    }

    public async Task DeleteMemberAsync(long id, CancellationToken cancellationToken = default)
    {
        var member = await _dbContext.ProjectMembers.FirstOrDefaultAsync(x => x.ProjectMemberId == id, cancellationToken);
        if (member is null) throw new NotFoundException("Project member not found.");
        member.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "delete", $"Disabled project member {member.UserId}", "ProjectMember", member.ProjectMemberId, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<ProjectDocumentDto>> GetDocumentsAsync(PaginationQuery query, long? projectId = null, CancellationToken cancellationToken = default)
    {
        var documents = _dbContext.ProjectDocuments.Where(x => x.IsActive);
        if (projectId is not null) documents = documents.Where(x => x.ProjectId == projectId);
        if (!string.IsNullOrWhiteSpace(query.Search)) documents = documents.Where(x => x.DocumentTitle.Contains(query.Search) || x.DocumentType.Contains(query.Search));
        var total = await documents.CountAsync(cancellationToken);
        var items = await documents.OrderByDescending(x => x.UploadedAt).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<ProjectDocumentDto>.Create(items.Select(MapDocument).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectDocumentDto> CreateDocumentAsync(CreateProjectDocumentRequest request, CancellationToken cancellationToken = default)
    {
        var document = new ProjectDocument { ProjectId = request.ProjectId, PhaseId = request.PhaseId, MilestoneId = request.MilestoneId, DocumentType = request.DocumentType, DocumentTitle = request.DocumentTitle, FileName = request.FileName, FileUrl = request.FileUrl, FileSizeBytes = request.FileSizeBytes, MimeType = request.MimeType, VersionLabel = request.VersionLabel, UploadedAt = DateTime.UtcNow, UploadedBy = _userContext.User?.UserId, IsActive = true };
        _dbContext.ProjectDocuments.Add(document);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "create", $"Created document {document.DocumentTitle}", "ProjectDocument", document.DocumentId, cancellationToken: cancellationToken);
        return MapDocument(document);
    }

    public async Task<ProjectDocumentDto> UpdateDocumentAsync(long id, UpdateProjectDocumentRequest request, CancellationToken cancellationToken = default)
    {
        var document = await _dbContext.ProjectDocuments.FirstOrDefaultAsync(x => x.DocumentId == id, cancellationToken);
        if (document is null) throw new NotFoundException("Project document not found.");
        document.PhaseId = request.PhaseId;
        document.MilestoneId = request.MilestoneId;
        document.DocumentType = request.DocumentType;
        document.DocumentTitle = request.DocumentTitle;
        document.FileName = request.FileName;
        document.FileUrl = request.FileUrl;
        document.FileSizeBytes = request.FileSizeBytes;
        document.MimeType = request.MimeType;
        document.VersionLabel = request.VersionLabel;
        document.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "update", $"Updated document {document.DocumentTitle}", "ProjectDocument", document.DocumentId, cancellationToken: cancellationToken);
        return MapDocument(document);
    }

    public async Task DeleteDocumentAsync(long id, CancellationToken cancellationToken = default)
    {
        var document = await _dbContext.ProjectDocuments.FirstOrDefaultAsync(x => x.DocumentId == id, cancellationToken);
        if (document is null) throw new NotFoundException("Project document not found.");
        document.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "delete", $"Disabled document {document.DocumentTitle}", "ProjectDocument", document.DocumentId, cancellationToken: cancellationToken);
    }

    private IQueryable<ResearchProject> ProjectGraph() => _dbContext.ResearchProjects
        .Include(x => x.LeadDepartment)
        .Include(x => x.PrincipalInvestigator)
        .Include(x => x.Sponsor)
        .Include(x => x.ProjectDeadlines);

    private IQueryable<ProjectPhase> PhaseGraph() => _dbContext.ProjectPhases.Include(x => x.Project).Include(x => x.OwnerUser);
    private IQueryable<ProjectMilestone> MilestoneGraph() => _dbContext.ProjectMilestones.Include(x => x.Project).Include(x => x.Phase).Include(x => x.OwnerUser);
    private IQueryable<ProjectDeadline> DeadlineGraph() => _dbContext.ProjectDeadlines.Include(x => x.Project).Include(x => x.Phase).Include(x => x.Milestone).Include(x => x.ResponsibleUser);

    private async Task RecalculateProjectProgressAsync(long projectId, CancellationToken cancellationToken)
    {
        var phases = await _dbContext.ProjectPhases.Where(x => x.ProjectId == projectId && x.DeletedAt == null && x.IsActive).ToListAsync(cancellationToken);
        var project = await _dbContext.ResearchProjects.FirstOrDefaultAsync(x => x.ProjectId == projectId, cancellationToken);
        if (project is null) return;
        project.ProgressPercent = phases.Count == 0 ? 0 : Math.Round(phases.Average(x => x.ProgressPercent), 2);
        project.UpdatedAt = DateTime.UtcNow;
        project.UpdatedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateProgress(decimal progress)
    {
        if (progress < 0 || progress > 100) throw new InvalidOperationException("Progress percent must be between 0 and 100.");
    }

    private static void ValidateDateRange(DateOnly? start, DateOnly? end)
    {
        if (start is not null && end is not null && start > end) throw new InvalidOperationException("Start date must be before or equal to end date.");
    }

    private static string NormalizeDatePrecision(string? precision)
    {
        if (string.IsNullOrWhiteSpace(precision)) return "DAY";
        var normalized = precision.Trim().ToUpperInvariant();
        return normalized is "DAY" or "MONTH"
            ? normalized
            : throw new InvalidOperationException("Date precision must be DAY or MONTH.");
    }

    private static DateOnly? NormalizeDateValue(DateOnly? value, string precision)
    {
        if (value is null) return null;
        return precision == "MONTH" ? new DateOnly(value.Value.Year, value.Value.Month, 1) : value;
    }

    private static DateOnly NormalizeRequiredDateValue(DateOnly value, string precision)
    {
        return precision == "MONTH" ? new DateOnly(value.Year, value.Month, 1) : value;
    }

    private async Task<Dictionary<string, string>> GetMasterDataNamesAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.MasterDataItems
            .Where(x => x.DeletedAt == null)
            .ToDictionaryAsync(x => $"{x.CategoryCode}|{x.ItemCode}", x => x.ItemName, cancellationToken);
    }

    private async Task ValidateSponsorAsync(long? sponsorId, long? currentSponsorId, CancellationToken cancellationToken)
    {
        if (sponsorId is null) return;
        var sponsor = await _dbContext.Sponsors.FirstOrDefaultAsync(x => x.SponsorId == sponsorId.Value && x.DeletedAt == null, cancellationToken);
        if (sponsor is null) throw new InvalidOperationException("Nhà tài trợ/nguồn kinh phí không hợp lệ.");
        if (!sponsor.IsActive && sponsor.SponsorId != currentSponsorId) throw new InvalidOperationException("Nhà tài trợ/nguồn kinh phí đã ngừng sử dụng.");
    }

    private async Task ValidateMasterDataValueAsync(string category, string? value, string? currentValue, string message, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        var normalized = value.Trim();
        if (!string.IsNullOrWhiteSpace(currentValue) && string.Equals(normalized, currentValue.Trim(), StringComparison.Ordinal))
        {
            return;
        }

        var hasCategory = await _dbContext.MasterDataItems.AnyAsync(x => x.CategoryCode == category && x.DeletedAt == null, cancellationToken);
        if (!hasCategory) return;

        var exists = await _dbContext.MasterDataItems.AnyAsync(x =>
            x.CategoryCode == category &&
            x.ItemCode == normalized &&
            x.IsActive &&
            x.DeletedAt == null, cancellationToken);
        if (!exists) throw new InvalidOperationException(message);
    }

    private static string? MasterName(IReadOnlyDictionary<string, string> names, string category, string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        return names.TryGetValue($"{category}|{code}", out var name) ? name : null;
    }

    private static ResearchProjectDto MapProject(ResearchProject project, IReadOnlyDictionary<string, string> masterNames)
    {
        var nearestDeadline = project.ProjectDeadlines.Where(x => x.DeletedAt == null && x.DeadlineStatus != "completed").OrderBy(x => x.DueDate).FirstOrDefault();
        return new ResearchProjectDto(project.ProjectId, project.ProjectCode, project.ProjectTitle, project.ProjectDescription, project.LeadDepartmentId, project.LeadDepartment?.DepartmentName, project.PrincipalInvestigatorId, project.PrincipalInvestigator?.FullName, project.SponsorId, project.Sponsor?.SponsorName ?? project.SponsorNameText, project.ResearchType, MasterName(masterNames, ResearchTypeCategory, project.ResearchType), project.ProtocolNumber, project.ProtocolVersion, project.EthicsStatus, MasterName(masterNames, EthicsStatusCategory, project.EthicsStatus), project.EthicsApprovalDate, project.EthicsExpiryDate, project.PlannedStartDate, NormalizeDatePrecision(project.PlannedStartDatePrecision), project.PlannedEndDate, NormalizeDatePrecision(project.PlannedEndDatePrecision), project.ActualStartDate, NormalizeDatePrecision(project.ActualStartDatePrecision), project.ActualEndDate, NormalizeDatePrecision(project.ActualEndDatePrecision), project.CurrentPhaseName, MasterName(masterNames, CurrentStageCategory, project.CurrentPhaseName), project.ProgressPercent, project.ProjectStatus, MasterName(masterNames, ProjectStatusCategory, project.ProjectStatus), project.RiskLevel, MasterName(masterNames, RiskLevelCategory, project.RiskLevel), nearestDeadline?.DueDate, NormalizeDatePrecision(nearestDeadline?.DueDatePrecision), project.Notes);
    }

    private static ProjectPhaseDto MapPhase(ProjectPhase phase) => new(phase.PhaseId, phase.ProjectId, phase.Project.ProjectCode, phase.Project.ProjectTitle, phase.PhaseName, phase.PhaseDescription, phase.OwnerUserId, phase.OwnerUser?.FullName, phase.PlannedStartDate, NormalizeDatePrecision(phase.PlannedStartDatePrecision), phase.PlannedEndDate, NormalizeDatePrecision(phase.PlannedEndDatePrecision), phase.DeadlineDate, NormalizeDatePrecision(phase.DeadlineDatePrecision), phase.ActualStartDate, NormalizeDatePrecision(phase.ActualStartDatePrecision), phase.ActualEndDate, NormalizeDatePrecision(phase.ActualEndDatePrecision), phase.ProgressPercent, phase.PhaseStatus, phase.Notes, phase.SortOrder);
    private static ProjectMilestoneDto MapMilestone(ProjectMilestone milestone, IReadOnlyDictionary<string, string>? masterNames = null) => new(milestone.MilestoneId, milestone.ProjectId, milestone.Project.ProjectCode, milestone.Project.ProjectTitle, milestone.PhaseId, milestone.Phase?.PhaseName, milestone.MilestoneName, milestone.MilestoneDescription, milestone.DueDate, NormalizeDatePrecision(milestone.DueDatePrecision), milestone.OwnerUserId, milestone.OwnerUser?.FullName, milestone.MilestoneStatus, milestone.PriorityLevel, masterNames is null ? milestone.PriorityLevel : MasterName(masterNames, RiskLevelCategory, milestone.PriorityLevel), milestone.CompletedDate, NormalizeDatePrecision(milestone.CompletedDatePrecision), milestone.Notes);

    private static ProjectDeadlineDto MapDeadline(ProjectDeadline deadline)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysRemaining = deadline.DueDate.DayNumber - today.DayNumber;
        var isOverdue = daysRemaining < 0 && deadline.DeadlineStatus != "completed";
        var severity = deadline.DeadlineStatus == "completed" ? "completed" : isOverdue ? "overdue" : daysRemaining <= 3 ? "urgent" : daysRemaining <= 7 ? "soon" : "normal";
        return new ProjectDeadlineDto(deadline.DeadlineId, deadline.ProjectId, deadline.Project?.ProjectCode, deadline.Project?.ProjectTitle, deadline.PhaseId, deadline.Phase?.PhaseName, deadline.MilestoneId, deadline.Milestone?.MilestoneName, deadline.DeadlineType, deadline.DeadlineTitle, deadline.DeadlineDescription, deadline.DueDate, NormalizeDatePrecision(deadline.DueDatePrecision), deadline.ResponsibleUserId, deadline.ResponsibleUser?.FullName, deadline.PriorityLevel, deadline.DeadlineStatus, deadline.CompletedAt, null, daysRemaining, isOverdue, severity);
    }

    private static SponsorDto MapSponsor(Sponsor sponsor) => new(sponsor.SponsorId, sponsor.SponsorCode, sponsor.SponsorName, sponsor.SponsorType, sponsor.IsActive);
    private static ProjectMemberDto MapMember(ProjectMember member) => new(member.ProjectMemberId, member.ProjectId, member.UserId, member.User.FullName, member.MemberRole, member.Responsibility, member.JoinedAt, member.LeftAt, member.IsActive);
    private static ProjectDocumentDto MapDocument(ProjectDocument document) => new(document.DocumentId, document.ProjectId, document.PhaseId, document.MilestoneId, document.DocumentType, document.DocumentTitle, document.FileName, document.FileUrl, document.FileSizeBytes, document.MimeType, document.VersionLabel, document.UploadedAt, document.UploadedBy);
}
