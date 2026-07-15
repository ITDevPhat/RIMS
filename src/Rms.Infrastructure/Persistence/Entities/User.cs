using System;
using System.Collections.Generic;

namespace Rms.Infrastructure.Persistence.Entities;

public partial class User
{
    public long UserId { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? PasswordSalt { get; set; }

    public string FullName { get; set; } = null!;

    public string? Initials { get; set; }

    public string? PhoneNumber { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Title { get; set; }

    public long? DepartmentId { get; set; }

    public string AccountStatus { get; set; } = null!;

    public bool IsSystemAdmin { get; set; }

    public bool EmailConfirmed { get; set; }

    public bool MustChangePassword { get; set; }

    public int FailedLoginCount { get; set; }

    public DateTime? LockedUntil { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public string? LastLoginIp { get; set; }

    public DateTime? PasswordChangedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public long RowVersion { get; set; } = 1;

    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();

    public virtual ICollection<DataChangeLog> DataChangeLogs { get; set; } = new List<DataChangeLog>();

    public virtual Department? Department { get; set; }

    public virtual ICollection<LoginEvent> LoginEvents { get; set; } = new List<LoginEvent>();

    public virtual ICollection<LoginSession> LoginSessions { get; set; } = new List<LoginSession>();

    public virtual ICollection<NotificationRecipient> NotificationRecipients { get; set; } = new List<NotificationRecipient>();

    public virtual ICollection<NotificationRule> NotificationRuleCreatedByNavigations { get; set; } = new List<NotificationRule>();

    public virtual ICollection<NotificationRule> NotificationRuleUpdatedByNavigations { get; set; } = new List<NotificationRule>();

    public virtual ICollection<NotificationSetting> NotificationSettingUpdatedByNavigations { get; set; } = new List<NotificationSetting>();

    public virtual ICollection<NotificationSetting> NotificationSettingUsers { get; set; } = new List<NotificationSetting>();

    public virtual ICollection<NotificationTemplate> NotificationTemplateCreatedByNavigations { get; set; } = new List<NotificationTemplate>();

    public virtual ICollection<NotificationTemplate> NotificationTemplateUpdatedByNavigations { get; set; } = new List<NotificationTemplate>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokenCreatedByNavigations { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokenUsers { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<ProjectDeadline> ProjectDeadlineCreatedByNavigations { get; set; } = new List<ProjectDeadline>();

    public virtual ICollection<ProjectDeadline> ProjectDeadlineResponsibleUsers { get; set; } = new List<ProjectDeadline>();

    public virtual ICollection<ProjectDeadline> ProjectDeadlineUpdatedByNavigations { get; set; } = new List<ProjectDeadline>();

    public virtual ICollection<ProjectDocument> ProjectDocuments { get; set; } = new List<ProjectDocument>();

    public virtual ICollection<ProjectMember> ProjectMemberCreatedByNavigations { get; set; } = new List<ProjectMember>();

    public virtual ICollection<ProjectMember> ProjectMemberUsers { get; set; } = new List<ProjectMember>();

    public virtual ICollection<ProjectMilestone> ProjectMilestoneCreatedByNavigations { get; set; } = new List<ProjectMilestone>();

    public virtual ICollection<ProjectMilestone> ProjectMilestoneOwnerUsers { get; set; } = new List<ProjectMilestone>();

    public virtual ICollection<ProjectMilestone> ProjectMilestoneUpdatedByNavigations { get; set; } = new List<ProjectMilestone>();

    public virtual ICollection<ProjectPhase> ProjectPhaseCreatedByNavigations { get; set; } = new List<ProjectPhase>();

    public virtual ICollection<ProjectPhase> ProjectPhaseOwnerUsers { get; set; } = new List<ProjectPhase>();

    public virtual ICollection<ProjectPhase> ProjectPhaseUpdatedByNavigations { get; set; } = new List<ProjectPhase>();

    public virtual ICollection<ResearchProject> ResearchProjectCreatedByNavigations { get; set; } = new List<ResearchProject>();

    public virtual ICollection<ResearchProject> ResearchProjectPrincipalInvestigators { get; set; } = new List<ResearchProject>();

    public virtual ICollection<ResearchProject> ResearchProjectUpdatedByNavigations { get; set; } = new List<ResearchProject>();

    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

    public virtual ICollection<Sponsor> SponsorCreatedByNavigations { get; set; } = new List<Sponsor>();

    public virtual ICollection<Sponsor> SponsorUpdatedByNavigations { get; set; } = new List<Sponsor>();

    public virtual ICollection<TrainingEvent> TrainingEventCreatedByNavigations { get; set; } = new List<TrainingEvent>();

    public virtual ICollection<TrainingEventLog> TrainingEventLogs { get; set; } = new List<TrainingEventLog>();

    public virtual ICollection<TrainingEventParticipant> TrainingEventParticipantCreatedByNavigations { get; set; } = new List<TrainingEventParticipant>();

    public virtual ICollection<TrainingEventParticipant> TrainingEventParticipantUsers { get; set; } = new List<TrainingEventParticipant>();

    public virtual ICollection<TrainingEvent> TrainingEventResponsibleUsers { get; set; } = new List<TrainingEvent>();

    public virtual ICollection<TrainingEvent> TrainingEventUpdatedByNavigations { get; set; } = new List<TrainingEvent>();

    public virtual UserPreference? UserPreference { get; set; }

    public virtual ICollection<UserRole> UserRoleAssignedByNavigations { get; set; } = new List<UserRole>();

    public virtual ICollection<UserRole> UserRoleUsers { get; set; } = new List<UserRole>();
}
