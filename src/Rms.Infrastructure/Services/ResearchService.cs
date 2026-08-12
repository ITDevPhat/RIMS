using Microsoft.EntityFrameworkCore;
using Rms.Application.Admin;
using Rms.Application.Common;
using Rms.Application.Research;
using Rms.Infrastructure.Persistence;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Services;

public sealed class ResearchService : IResearchService
{
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

        return PagedResult<ResearchProjectDto>.Create(items.Select(MapProject).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ResearchProjectDto> GetProjectAsync(long id, CancellationToken cancellationToken = default)
    {
        var project = await ProjectGraph().FirstOrDefaultAsync(x => x.ProjectId == id && x.DeletedAt == null, cancellationToken);
        return project is null ? throw new NotFoundException("Research project not found.") : MapProject(project);
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
            MapProject(project),
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
        var registrationDatePrecision = NormalizeDatePrecision(request.RegistrationDatePrecision);
        var proposalReviewDatePrecision = NormalizeDatePrecision(request.ProposalReviewDatePrecision);
        var acceptanceDatePrecision = NormalizeDatePrecision(request.AcceptanceDatePrecision);
        var pi = request.PrincipalInvestigatorId is null ? null : await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == request.PrincipalInvestigatorId && x.DeletedAt == null, cancellationToken);
        if (request.PrincipalInvestigatorId is not null && pi is null) throw new InvalidOperationException("Không tìm thấy tài khoản chủ nhiệm đề tài.");
        if (request.PrincipalInvestigatorId is null && string.IsNullOrWhiteSpace(request.PrincipalInvestigatorName)) throw new InvalidOperationException("Vui lòng nhập tên chủ nhiệm đề tài.");
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
            PrincipalInvestigatorName = pi?.FullName ?? request.PrincipalInvestigatorName?.Trim(),
            PrincipalInvestigatorEmail = pi?.Email ?? request.PrincipalInvestigatorEmail?.Trim(),
            RegistrationDate = NormalizeDateValue(request.RegistrationDate, registrationDatePrecision),
            RegistrationDatePrecision = registrationDatePrecision,
            ProposalReviewDate = NormalizeDateValue(request.ProposalReviewDate, proposalReviewDatePrecision),
            ProposalReviewDatePrecision = proposalReviewDatePrecision,
            AcceptanceDate = NormalizeDateValue(request.AcceptanceDate, acceptanceDatePrecision),
            AcceptanceDatePrecision = acceptanceDatePrecision,
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
        var registrationDatePrecision = NormalizeDatePrecision(request.RegistrationDatePrecision);
        var proposalReviewDatePrecision = NormalizeDatePrecision(request.ProposalReviewDatePrecision);
        var acceptanceDatePrecision = NormalizeDatePrecision(request.AcceptanceDatePrecision);
        var pi = request.PrincipalInvestigatorId is null ? null : await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == request.PrincipalInvestigatorId && x.DeletedAt == null, cancellationToken);
        if (request.PrincipalInvestigatorId is not null && pi is null) throw new InvalidOperationException("Không tìm thấy tài khoản chủ nhiệm đề tài.");
        if (request.PrincipalInvestigatorId is null && string.IsNullOrWhiteSpace(request.PrincipalInvestigatorName)) throw new InvalidOperationException("Vui lòng nhập tên chủ nhiệm đề tài.");
        var project = await _dbContext.ResearchProjects.FirstOrDefaultAsync(x => x.ProjectId == id && x.DeletedAt == null, cancellationToken);
        if (project is null) throw new NotFoundException("Research project not found.");

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
        project.PrincipalInvestigatorName = pi?.FullName ?? request.PrincipalInvestigatorName?.Trim();
        project.PrincipalInvestigatorEmail = pi?.Email ?? request.PrincipalInvestigatorEmail?.Trim();
        project.RegistrationDate = NormalizeDateValue(request.RegistrationDate, registrationDatePrecision);
        project.RegistrationDatePrecision = registrationDatePrecision;
        project.ProposalReviewDate = NormalizeDateValue(request.ProposalReviewDate, proposalReviewDatePrecision);
        project.ProposalReviewDatePrecision = proposalReviewDatePrecision;
        project.AcceptanceDate = NormalizeDateValue(request.AcceptanceDate, acceptanceDatePrecision);
        project.AcceptanceDatePrecision = acceptanceDatePrecision;
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
        return PagedResult<ProjectMilestoneDto>.Create(items.Select(MapMilestone).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectMilestoneDto> GetMilestoneAsync(long id, CancellationToken cancellationToken = default)
    {
        var milestone = await MilestoneGraph().FirstOrDefaultAsync(x => x.MilestoneId == id && x.DeletedAt == null, cancellationToken);
        return milestone is null ? throw new NotFoundException("Project milestone not found.") : MapMilestone(milestone);
    }

    public async Task<ProjectMilestoneDto> CreateMilestoneAsync(CreateProjectMilestoneRequest request, CancellationToken cancellationToken = default)
    {
        var dueDatePrecision = NormalizeDatePrecision(request.DueDatePrecision);
        var completedAtPrecision = NormalizeDatePrecision(request.CompletedAtPrecision);
        var milestone = new ProjectMilestone
        {
            ProjectId = request.ProjectId,
            PhaseId = request.PhaseId,
            MilestoneName = request.MilestoneName,
            MilestoneType = request.MilestoneType,
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
        milestone.PhaseId = request.PhaseId;
        milestone.MilestoneName = request.MilestoneName;
        milestone.MilestoneType = request.MilestoneType;
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

    public async Task<PagedResult<SponsorDto>> GetSponsorsAsync(PaginationQuery query, CancellationToken cancellationToken = default)
    {
        var sponsors = _dbContext.Sponsors.Where(x => x.DeletedAt == null);
        if (!string.IsNullOrWhiteSpace(query.Search)) sponsors = sponsors.Where(x => x.SponsorCode.Contains(query.Search) || x.SponsorName.Contains(query.Search));
        var total = await sponsors.CountAsync(cancellationToken);
        var items = await sponsors.OrderBy(x => x.SponsorName).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<SponsorDto>.Create(items.Select(MapSponsor).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<SponsorDto> CreateSponsorAsync(CreateSponsorRequest request, CancellationToken cancellationToken = default)
    {
        var sponsor = new Sponsor { SponsorCode = request.SponsorCode, SponsorName = request.SponsorName, SponsorType = request.SponsorType, ContactPerson = request.ContactPerson, ContactEmail = request.ContactEmail, ContactPhone = request.ContactPhone, Address = request.Address, IsActive = request.IsActive, CreatedAt = DateTime.UtcNow, CreatedBy = _userContext.User?.UserId };
        _dbContext.Sponsors.Add(sponsor);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "create", $"Created sponsor {sponsor.SponsorCode}", "Sponsor", sponsor.SponsorId, sponsor.SponsorCode, cancellationToken: cancellationToken);
        return MapSponsor(sponsor);
    }

    public async Task<SponsorDto> UpdateSponsorAsync(long id, UpdateSponsorRequest request, CancellationToken cancellationToken = default)
    {
        var sponsor = await _dbContext.Sponsors.FirstOrDefaultAsync(x => x.SponsorId == id && x.DeletedAt == null, cancellationToken);
        if (sponsor is null) throw new NotFoundException("Sponsor not found.");
        sponsor.SponsorName = request.SponsorName;
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
        sponsor.DeletedAt = DateTime.UtcNow;
        sponsor.DeletedBy = _userContext.User?.UserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "delete", $"Deleted sponsor {sponsor.SponsorCode}", "Sponsor", sponsor.SponsorId, sponsor.SponsorCode, cancellationToken: cancellationToken);
    }

    public async Task<PagedResult<ProjectMemberDto>> GetMembersAsync(PaginationQuery query, long? projectId = null, CancellationToken cancellationToken = default)
    {
        var members = _dbContext.ProjectMembers.Include(x => x.User).Include(x => x.Department).Where(x => x.DeletedAt == null);
        if (projectId is not null) members = members.Where(x => x.ProjectId == projectId);
        if (!string.IsNullOrWhiteSpace(query.Search)) members = members.Where(x => (x.MemberName != null && x.MemberName.Contains(query.Search)) || (x.User != null && x.User.FullName.Contains(query.Search)) || x.MemberRole.Contains(query.Search));
        var total = await members.CountAsync(cancellationToken);
        var items = await members.OrderBy(x => x.SortOrder).ThenBy(x => x.ProjectMemberId).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return PagedResult<ProjectMemberDto>.Create(items.Select(MapMember).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<ProjectMemberDto> CreateMemberAsync(CreateProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        if (request.UserId is null && string.IsNullOrWhiteSpace(request.MemberName)) throw new InvalidOperationException("Thành viên phải có tài khoản hệ thống hoặc họ tên.");
        var user = request.UserId is null ? null : await _dbContext.Users.Include(x => x.Department).AsNoTracking().FirstOrDefaultAsync(x => x.UserId == request.UserId && x.DeletedAt == null, cancellationToken);
        if (request.UserId is not null && user is null) throw new InvalidOperationException("Không tìm thấy tài khoản thành viên.");
        if (request.UserId is not null && await _dbContext.ProjectMembers.AnyAsync(x => x.ProjectId == request.ProjectId && x.UserId == request.UserId && x.DeletedAt == null, cancellationToken)) throw new InvalidOperationException("Thành viên này đã có trong đề tài.");
        var member = new ProjectMember { ProjectId = request.ProjectId, UserId = request.UserId, MemberName = user?.FullName ?? request.MemberName?.Trim(), Email = user?.Email ?? request.Email?.Trim(), DepartmentId = user?.DepartmentId ?? request.DepartmentId, DepartmentNameText = user?.Department?.DepartmentName ?? request.DepartmentNameText?.Trim(), MemberRole = request.MemberRole, Responsibility = request.Responsibility, SortOrder = request.SortOrder, JoinedAt = request.JoinedAt, LeftAt = request.LeftAt, IsActive = request.IsActive, CreatedAt = DateTime.UtcNow, CreatedBy = _userContext.User?.UserId };
        _dbContext.ProjectMembers.Add(member);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "create", $"Created project member {member.UserId}", "ProjectMember", member.ProjectMemberId, cancellationToken: cancellationToken);
        var created = await _dbContext.ProjectMembers
            .Include(x => x.User).Include(x => x.Department)
            .FirstAsync(x => x.ProjectMemberId == member.ProjectMemberId, cancellationToken);
        return MapMember(created);
    }

    public async Task<ProjectMemberDto> UpdateMemberAsync(long id, UpdateProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        var member = await _dbContext.ProjectMembers.Include(x => x.User).Include(x => x.Department).FirstOrDefaultAsync(x => x.ProjectMemberId == id && x.DeletedAt == null, cancellationToken);
        if (member is null) throw new NotFoundException("Project member not found.");
        if (request.RowVersion is not null && request.RowVersion != member.RowVersion) throw new InvalidOperationException("Dữ liệu thành viên đã được thay đổi. Vui lòng tải lại.");
        if (request.UserId is null && string.IsNullOrWhiteSpace(request.MemberName)) throw new InvalidOperationException("Thành viên phải có tài khoản hệ thống hoặc họ tên.");
        var user = request.UserId is null ? null : await _dbContext.Users.Include(x => x.Department).AsNoTracking().FirstOrDefaultAsync(x => x.UserId == request.UserId && x.DeletedAt == null, cancellationToken);
        if (request.UserId is not null && user is null) throw new InvalidOperationException("Không tìm thấy tài khoản thành viên.");
        if (request.UserId is not null && await _dbContext.ProjectMembers.AnyAsync(x => x.ProjectMemberId != id && x.ProjectId == member.ProjectId && x.UserId == request.UserId && x.DeletedAt == null, cancellationToken)) throw new InvalidOperationException("Thành viên này đã có trong đề tài.");
        member.UserId = request.UserId;
        member.MemberName = user?.FullName ?? request.MemberName?.Trim();
        member.Email = user?.Email ?? request.Email?.Trim();
        member.DepartmentId = user?.DepartmentId ?? request.DepartmentId;
        member.DepartmentNameText = user?.Department?.DepartmentName ?? request.DepartmentNameText?.Trim();
        member.MemberRole = request.MemberRole;
        member.Responsibility = request.Responsibility;
        member.JoinedAt = request.JoinedAt;
        member.LeftAt = request.LeftAt;
        member.IsActive = request.IsActive;
        member.SortOrder = request.SortOrder;
        member.UpdatedAt = DateTime.UtcNow;
        member.UpdatedBy = _userContext.User?.UserId;
        member.RowVersion++;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _auditService.WriteActivityAsync("research_project", "update", $"Updated project member {member.UserId}", "ProjectMember", member.ProjectMemberId, cancellationToken: cancellationToken);
        return MapMember(member);
    }

    public async Task DeleteMemberAsync(long id, CancellationToken cancellationToken = default)
    {
        var member = await _dbContext.ProjectMembers.FirstOrDefaultAsync(x => x.ProjectMemberId == id && x.DeletedAt == null, cancellationToken);
        if (member is null) throw new NotFoundException("Project member not found.");
        member.IsActive = false;
        member.DeletedAt = DateTime.UtcNow;
        member.DeletedBy = _userContext.User?.UserId;
        member.RowVersion++;
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

    private static ResearchProjectDto MapProject(ResearchProject project)
    {
        var nearestDeadline = project.ProjectDeadlines.Where(x => x.DeletedAt == null && x.DeadlineStatus != "completed").OrderBy(x => x.DueDate).FirstOrDefault();
        return new ResearchProjectDto(project.ProjectId, project.ProjectCode, project.ProjectTitle, project.ProjectDescription, project.LeadDepartmentId, project.LeadDepartment?.DepartmentName, project.PrincipalInvestigatorId, project.PrincipalInvestigatorName ?? project.PrincipalInvestigator?.FullName, project.PrincipalInvestigatorEmail ?? project.PrincipalInvestigator?.Email, project.SponsorId, project.Sponsor?.SponsorName ?? project.SponsorNameText, project.ResearchType, project.ProtocolNumber, project.ProtocolVersion, project.EthicsStatus, project.EthicsApprovalDate, project.EthicsExpiryDate, project.RegistrationDate, NormalizeDatePrecision(project.RegistrationDatePrecision), project.ProposalReviewDate, NormalizeDatePrecision(project.ProposalReviewDatePrecision), project.AcceptanceDate, NormalizeDatePrecision(project.AcceptanceDatePrecision), project.PlannedStartDate, NormalizeDatePrecision(project.PlannedStartDatePrecision), project.PlannedEndDate, NormalizeDatePrecision(project.PlannedEndDatePrecision), project.ActualStartDate, NormalizeDatePrecision(project.ActualStartDatePrecision), project.ActualEndDate, NormalizeDatePrecision(project.ActualEndDatePrecision), project.CurrentPhaseName, project.ProgressPercent, project.ProjectStatus, project.RiskLevel, nearestDeadline?.DueDate, NormalizeDatePrecision(nearestDeadline?.DueDatePrecision), project.Notes);
    }

    private static ProjectPhaseDto MapPhase(ProjectPhase phase) => new(phase.PhaseId, phase.ProjectId, phase.Project.ProjectCode, phase.Project.ProjectTitle, phase.PhaseName, phase.PhaseDescription, phase.OwnerUserId, phase.OwnerUser?.FullName, phase.PlannedStartDate, NormalizeDatePrecision(phase.PlannedStartDatePrecision), phase.PlannedEndDate, NormalizeDatePrecision(phase.PlannedEndDatePrecision), phase.DeadlineDate, NormalizeDatePrecision(phase.DeadlineDatePrecision), phase.ActualStartDate, NormalizeDatePrecision(phase.ActualStartDatePrecision), phase.ActualEndDate, NormalizeDatePrecision(phase.ActualEndDatePrecision), phase.ProgressPercent, phase.PhaseStatus, phase.Notes, phase.SortOrder);
    private static ProjectMilestoneDto MapMilestone(ProjectMilestone milestone) => new(milestone.MilestoneId, milestone.ProjectId, milestone.Project.ProjectCode, milestone.Project.ProjectTitle, milestone.PhaseId, milestone.Phase?.PhaseName, milestone.MilestoneName, milestone.MilestoneType, milestone.MilestoneDescription, milestone.DueDate, NormalizeDatePrecision(milestone.DueDatePrecision), milestone.OwnerUserId, milestone.OwnerUser?.FullName, milestone.MilestoneStatus, milestone.PriorityLevel, milestone.CompletedDate, NormalizeDatePrecision(milestone.CompletedDatePrecision), milestone.Notes);

    private static ProjectDeadlineDto MapDeadline(ProjectDeadline deadline)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysRemaining = deadline.DueDate.DayNumber - today.DayNumber;
        var isOverdue = daysRemaining < 0 && deadline.DeadlineStatus != "completed";
        var severity = deadline.DeadlineStatus == "completed" ? "completed" : isOverdue ? "overdue" : daysRemaining <= 3 ? "urgent" : daysRemaining <= 7 ? "soon" : "normal";
        return new ProjectDeadlineDto(deadline.DeadlineId, deadline.ProjectId, deadline.Project?.ProjectCode, deadline.Project?.ProjectTitle, deadline.PhaseId, deadline.Phase?.PhaseName, deadline.MilestoneId, deadline.Milestone?.MilestoneName, deadline.DeadlineType, deadline.DeadlineTitle, deadline.DeadlineDescription, deadline.DueDate, NormalizeDatePrecision(deadline.DueDatePrecision), deadline.ResponsibleUserId, deadline.ResponsibleUser?.FullName, deadline.PriorityLevel, deadline.DeadlineStatus, deadline.CompletedAt, null, daysRemaining, isOverdue, severity);
    }

    private static SponsorDto MapSponsor(Sponsor sponsor) => new(sponsor.SponsorId, sponsor.SponsorCode, sponsor.SponsorName, sponsor.SponsorType, sponsor.IsActive);
    private static ProjectMemberDto MapMember(ProjectMember member) => new(member.ProjectMemberId, member.ProjectId, member.UserId, member.MemberName ?? member.User?.FullName ?? "", member.Email ?? member.User?.Email, member.DepartmentId, member.DepartmentNameText ?? member.Department?.DepartmentName, member.MemberRole, member.Responsibility, member.SortOrder, member.JoinedAt, member.LeftAt, member.IsActive, member.RowVersion);
    private static ProjectDocumentDto MapDocument(ProjectDocument document) => new(document.DocumentId, document.ProjectId, document.PhaseId, document.MilestoneId, document.DocumentType, document.DocumentTitle, document.FileName, document.FileUrl, document.FileSizeBytes, document.MimeType, document.VersionLabel, document.UploadedAt, document.UploadedBy);
}
