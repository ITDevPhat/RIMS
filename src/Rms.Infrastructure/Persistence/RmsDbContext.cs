using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Rms.Infrastructure.Persistence.Entities;

namespace Rms.Infrastructure.Persistence;

public partial class RmsDbContext : DbContext
{
    public RmsDbContext(DbContextOptions<RmsDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ActivityLog> ActivityLogs { get; set; }

    public virtual DbSet<DataChangeLog> DataChangeLogs { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<EventCategory> EventCategories { get; set; }

    public virtual DbSet<LoginEvent> LoginEvents { get; set; }

    public virtual DbSet<LoginSession> LoginSessions { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<NotificationRecipient> NotificationRecipients { get; set; }

    public virtual DbSet<NotificationRule> NotificationRules { get; set; }

    public virtual DbSet<NotificationSetting> NotificationSettings { get; set; }

    public virtual DbSet<NotificationTemplate> NotificationTemplates { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<ProjectDeadline> ProjectDeadlines { get; set; }

    public virtual DbSet<ProjectDocument> ProjectDocuments { get; set; }

    public virtual DbSet<ProjectMember> ProjectMembers { get; set; }

    public virtual DbSet<ProjectMilestone> ProjectMilestones { get; set; }

    public virtual DbSet<ProjectPhase> ProjectPhases { get; set; }

    public virtual DbSet<ResearchProject> ResearchProjects { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<RolePermission> RolePermissions { get; set; }

    public virtual DbSet<Sponsor> Sponsors { get; set; }

    public virtual DbSet<SystemSetting> SystemSettings { get; set; }

    public virtual DbSet<TrainingEvent> TrainingEvents { get; set; }

    public virtual DbSet<TrainingEventLog> TrainingEventLogs { get; set; }

    public virtual DbSet<TrainingEventParticipant> TrainingEventParticipants { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserPreference> UserPreferences { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    public virtual DbSet<VResearchProjectOverview> VResearchProjectOverviews { get; set; }

    public virtual DbSet<VTrainingMonthlySummary> VTrainingMonthlySummaries { get; set; }

    public virtual DbSet<VUserNotificationInbox> VUserNotificationInboxes { get; set; }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        IncrementConcurrencyVersions();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        IncrementConcurrencyVersions();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void IncrementConcurrencyVersions()
    {
        foreach (var entry in ChangeTracker.Entries().Where(x => x.State is EntityState.Added or EntityState.Modified))
        {
            var property = entry.Properties.FirstOrDefault(x => x.Metadata.Name == "RowVersion");
            if (property is null)
            {
                continue;
            }

            var current = property.CurrentValue is long value ? value : 0L;
            property.CurrentValue = entry.State == EntityState.Added ? Math.Max(current, 1L) : current + 1L;
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("activity_logs", "audit");

            entity.HasIndex(e => new { e.ModuleCode, e.ActionType, e.OccurredAt }, "IX_activity_logs_module").IsDescending(false, false, true);

            entity.HasIndex(e => e.OccurredAt, "IX_activity_logs_occurred").IsDescending();

            entity.HasIndex(e => new { e.UserId, e.OccurredAt }, "IX_activity_logs_user").IsDescending(false, true);

            entity.Property(e => e.ActivityLogId).HasColumnName("activity_log_id");
            entity.Property(e => e.ActionSummary)
                .HasMaxLength(1000)
                .HasColumnName("action_summary");
            entity.Property(e => e.ActionType)
                .HasMaxLength(100)
                .HasColumnName("action_type");
            entity.Property(e => e.EntityCode)
                .HasMaxLength(100)
                .HasColumnName("entity_code");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");
            entity.Property(e => e.EntityType)
                .HasMaxLength(100)
                .HasColumnName("entity_type");
            entity.Property(e => e.ErrorMessage).HasColumnName("error_message");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.ModuleCode)
                .HasMaxLength(100)
                .HasColumnName("module_code");
            entity.Property(e => e.NewValueJson)
                .HasColumnType("jsonb")
                .HasColumnName("new_value_json");
            entity.Property(e => e.OccurredAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("occurred_at");
            entity.Property(e => e.OldValueJson)
                .HasColumnType("jsonb")
                .HasColumnName("old_value_json");
            entity.Property(e => e.RequestId)
                .HasMaxLength(100)
                .HasColumnName("request_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("success")
                .HasColumnName("status");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(1000)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.ActivityLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_activity_logs_user");
        });

        modelBuilder.Entity<DataChangeLog>(entity =>
        {
            entity.ToTable("data_change_logs", "audit");

            entity.Property(e => e.DataChangeLogId).HasColumnName("data_change_log_id");
            entity.Property(e => e.ChangeType)
                .HasMaxLength(20)
                .HasColumnName("change_type");
            entity.Property(e => e.NewValueJson)
                .HasColumnType("jsonb")
                .HasColumnName("new_value_json");
            entity.Property(e => e.OccurredAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("occurred_at");
            entity.Property(e => e.OldValueJson)
                .HasColumnType("jsonb")
                .HasColumnName("old_value_json");
            entity.Property(e => e.PrimaryKeyValue)
                .HasMaxLength(255)
                .HasColumnName("primary_key_value");
            entity.Property(e => e.RequestId)
                .HasMaxLength(100)
                .HasColumnName("request_id");
            entity.Property(e => e.TableName)
                .HasMaxLength(128)
                .HasColumnName("table_name");
            entity.Property(e => e.TableSchema)
                .HasMaxLength(128)
                .HasColumnName("table_schema");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.DataChangeLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_data_change_logs_user");
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("departments", "ref");

            entity.HasIndex(e => e.DepartmentCode, "UQ_departments_code").IsUnique();

            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.DepartmentCode)
                .HasMaxLength(50)
                .HasColumnName("department_code");
            entity.Property(e => e.DepartmentName)
                .HasMaxLength(255)
                .HasColumnName("department_name");
            entity.Property(e => e.DepartmentType)
                .HasMaxLength(100)
                .HasColumnName("department_type");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.ParentDepartmentId).HasColumnName("parent_department_id");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.ParentDepartment).WithMany(p => p.InverseParentDepartment)
                .HasForeignKey(d => d.ParentDepartmentId)
                .HasConstraintName("FK_departments_parent");
        });

        modelBuilder.Entity<EventCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId);

            entity.ToTable("event_categories", "training");

            entity.HasIndex(e => e.CategoryCode, "UQ_event_categories_code").IsUnique();

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryCode)
                .HasMaxLength(100)
                .HasColumnName("category_code");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(255)
                .HasColumnName("category_name");
            entity.Property(e => e.ColorClass)
                .HasMaxLength(100)
                .HasColumnName("color_class");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
        });

        modelBuilder.Entity<LoginEvent>(entity =>
        {
            entity.ToTable("login_events", "audit");

            entity.HasIndex(e => new { e.OccurredAt, e.Success }, "IX_login_events_time").IsDescending(true, false);

            entity.HasIndex(e => new { e.UserId, e.OccurredAt }, "IX_login_events_user_time").IsDescending(false, true);

            entity.Property(e => e.LoginEventId).HasColumnName("login_event_id");
            entity.Property(e => e.EventType)
                .HasMaxLength(50)
                .HasColumnName("event_type");
            entity.Property(e => e.FailureReason)
                .HasMaxLength(1000)
                .HasColumnName("failure_reason");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.OccurredAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("occurred_at");
            entity.Property(e => e.Success).HasColumnName("success");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(1000)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.UsernameOrEmail)
                .HasMaxLength(255)
                .HasColumnName("username_or_email");

            entity.HasOne(d => d.User).WithMany(p => p.LoginEvents)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_login_events_user");
        });

        modelBuilder.Entity<LoginSession>(entity =>
        {
            entity.HasKey(e => e.SessionId);

            entity.ToTable("login_sessions", "auth");

            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.DeviceName)
                .HasMaxLength(255)
                .HasColumnName("device_name");
            entity.Property(e => e.ExpiresAt)
                .HasPrecision(0)
                .HasColumnName("expires_at");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(100)
                .HasColumnName("ip_address");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LoginAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("login_at");
            entity.Property(e => e.LogoutAt)
                .HasPrecision(0)
                .HasColumnName("logout_at");
            entity.Property(e => e.LogoutReason)
                .HasMaxLength(255)
                .HasColumnName("logout_reason");
            entity.Property(e => e.SessionTokenHash)
                .HasMaxLength(500)
                .HasColumnName("session_token_hash");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(1000)
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.LoginSessions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_login_sessions_user");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications", "notify");

            entity.HasIndex(e => new { e.CreatedAt, e.Category, e.PriorityLevel }, "IX_notifications_created").IsDescending(true, false, false);

            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.ActionUrl)
                .HasMaxLength(1000)
                .HasColumnName("action_url");
            entity.Property(e => e.Category)
                .HasMaxLength(100)
                .HasColumnName("category");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.ExpiresAt)
                .HasPrecision(0)
                .HasColumnName("expires_at");
            entity.Property(e => e.GeneratedByRuleId).HasColumnName("generated_by_rule_id");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(100)
                .HasColumnName("notification_type");
            entity.Property(e => e.PriorityLevel)
                .HasMaxLength(50)
                .HasDefaultValue("medium")
                .HasColumnName("priority_level");
            entity.Property(e => e.RelatedEntityCode)
                .HasMaxLength(100)
                .HasColumnName("related_entity_code");
            entity.Property(e => e.RelatedEntityId).HasColumnName("related_entity_id");
            entity.Property(e => e.RelatedEntityType)
                .HasMaxLength(100)
                .HasColumnName("related_entity_type");
            entity.Property(e => e.SuggestedAction)
                .HasMaxLength(255)
                .HasColumnName("suggested_action");
            entity.Property(e => e.Title)
                .HasMaxLength(500)
                .HasColumnName("title");

            entity.HasOne(d => d.GeneratedByRule).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.GeneratedByRuleId)
                .HasConstraintName("FK_notifications_rule");
        });

        modelBuilder.Entity<NotificationRecipient>(entity =>
        {
            entity.ToTable("notification_recipients", "notify");

            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt }, "IX_notification_recipients_user_read").IsDescending(false, false, true);

            entity.HasIndex(e => new { e.NotificationId, e.UserId }, "UQ_notification_recipients").IsUnique();

            entity.Property(e => e.NotificationRecipientId).HasColumnName("notification_recipient_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeliveredEmailAt)
                .HasPrecision(0)
                .HasColumnName("delivered_email_at");
            entity.Property(e => e.DeliveredInAppAt)
                .HasPrecision(0)
                .HasColumnName("delivered_in_app_at");
            entity.Property(e => e.DismissedAt)
                .HasPrecision(0)
                .HasColumnName("dismissed_at");
            entity.Property(e => e.EmailFailureReason)
                .HasMaxLength(1000)
                .HasColumnName("email_failure_reason");
            entity.Property(e => e.EmailSendStatus)
                .HasMaxLength(50)
                .HasColumnName("email_send_status");
            entity.Property(e => e.IsDismissed).HasColumnName("is_dismissed");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.ReadAt)
                .HasPrecision(0)
                .HasColumnName("read_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Notification).WithMany(p => p.NotificationRecipients)
                .HasForeignKey(d => d.NotificationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_notification_recipients_notification");

            entity.HasOne(d => d.User).WithMany(p => p.NotificationRecipients)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_notification_recipients_user");
        });

        modelBuilder.Entity<NotificationRule>(entity =>
        {
            entity.HasKey(e => e.RuleId);

            entity.ToTable("notification_rules", "notify");

            entity.HasIndex(e => new { e.IsActive, e.ObjectType, e.ConditionType, e.ReminderDays }, "IX_notification_rules_active");

            entity.HasIndex(e => e.RuleCode, "UQ_notification_rules_code").IsUnique();

            entity.Property(e => e.RuleId).HasColumnName("rule_id");
            entity.Property(e => e.ChannelEmail).HasColumnName("channel_email");
            entity.Property(e => e.ChannelInApp)
                .HasDefaultValue(true)
                .HasColumnName("channel_in_app");
            entity.Property(e => e.ConditionType)
                .HasMaxLength(100)
                .HasColumnName("condition_type");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.ObjectType)
                .HasMaxLength(100)
                .HasColumnName("object_type");
            entity.Property(e => e.PriorityLevel)
                .HasMaxLength(50)
                .HasDefaultValue("medium")
                .HasColumnName("priority_level");
            entity.Property(e => e.ReminderDays)
                .HasDefaultValue(1)
                .HasColumnName("reminder_days");
            entity.Property(e => e.RepeatIfOverdue).HasColumnName("repeat_if_overdue");
            entity.Property(e => e.RepeatIntervalDays).HasColumnName("repeat_interval_days");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.RuleCode)
                .HasMaxLength(100)
                .HasColumnName("rule_code");
            entity.Property(e => e.RuleName)
                .HasMaxLength(255)
                .HasColumnName("rule_name");
            entity.Property(e => e.TemplateId).HasColumnName("template_id");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.NotificationRuleCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_notification_rules_created_by");

            entity.HasOne(d => d.Template).WithMany(p => p.NotificationRules)
                .HasForeignKey(d => d.TemplateId)
                .HasConstraintName("FK_notification_rules_template");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.NotificationRuleUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_notification_rules_updated_by");
        });

        modelBuilder.Entity<NotificationSetting>(entity =>
        {
            entity.ToTable("notification_settings", "notify");

            entity.Property(e => e.NotificationSettingId).HasColumnName("notification_setting_id");
            entity.Property(e => e.AutoResolveWhenCompleted)
                .HasDefaultValue(true)
                .HasColumnName("auto_resolve_when_completed");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DailyScanTime)
                .HasPrecision(0)
                .HasDefaultValue(new TimeOnly(7, 0, 0))
                .HasColumnName("daily_scan_time");
            entity.Property(e => e.DeadlineReminderDaysJson)
                .HasColumnType("jsonb")
                .HasDefaultValue("[7,3,1,0]")
                .HasColumnName("deadline_reminder_days_json");
            entity.Property(e => e.EnableEmailNotification).HasColumnName("enable_email_notification");
            entity.Property(e => e.EnableInAppNotification)
                .HasDefaultValue(true)
                .HasColumnName("enable_in_app_notification");
            entity.Property(e => e.EnableSystemNotification)
                .HasDefaultValue(true)
                .HasColumnName("enable_system_notification");
            entity.Property(e => e.EthicsReminderDaysJson)
                .HasColumnType("jsonb")
                .HasDefaultValue("[90,30,7]")
                .HasColumnName("ethics_reminder_days_json");
            entity.Property(e => e.OverdueRepeatDays)
                .HasDefaultValue(1)
                .HasColumnName("overdue_repeat_days");
            entity.Property(e => e.ProgressReportReminderDaysJson)
                .HasColumnType("jsonb")
                .HasDefaultValue("[7,3,1]")
                .HasColumnName("progress_report_reminder_days_json");
            entity.Property(e => e.ProjectEndReminderDaysJson)
                .HasColumnType("jsonb")
                .HasDefaultValue("[30,14,7]")
                .HasColumnName("project_end_reminder_days_json");
            entity.Property(e => e.RepeatIfOverdue)
                .HasDefaultValue(true)
                .HasColumnName("repeat_if_overdue");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.ScopeType)
                .HasMaxLength(50)
                .HasColumnName("scope_type");
            entity.Property(e => e.TrainingEventReminderDaysJson)
                .HasColumnType("jsonb")
                .HasDefaultValue("[7,3,1,0]")
                .HasColumnName("training_event_reminder_days_json");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.NotificationSettingUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_notification_settings_updated_by");

            entity.HasOne(d => d.User).WithMany(p => p.NotificationSettingUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_notification_settings_user");
        });

        modelBuilder.Entity<NotificationTemplate>(entity =>
        {
            entity.HasKey(e => e.TemplateId);

            entity.ToTable("notification_templates", "notify");

            entity.HasIndex(e => e.TemplateCode, "UQ_notification_templates_code").IsUnique();

            entity.Property(e => e.TemplateId).HasColumnName("template_id");
            entity.Property(e => e.BodyTemplate).HasColumnName("body_template");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DefaultPriority)
                .HasMaxLength(50)
                .HasDefaultValue("medium")
                .HasColumnName("default_priority");
            entity.Property(e => e.EmailBodyTemplate).HasColumnName("email_body_template");
            entity.Property(e => e.EmailSubjectTemplate)
                .HasMaxLength(500)
                .HasColumnName("email_subject_template");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(100)
                .HasColumnName("notification_type");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.TemplateCode)
                .HasMaxLength(100)
                .HasColumnName("template_code");
            entity.Property(e => e.TemplateName)
                .HasMaxLength(255)
                .HasColumnName("template_name");
            entity.Property(e => e.TitleTemplate)
                .HasMaxLength(500)
                .HasColumnName("title_template");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.NotificationTemplateCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_notification_templates_created_by");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.NotificationTemplateUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_notification_templates_updated_by");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.TokenId);

            entity.ToTable("password_reset_tokens", "auth");

            entity.Property(e => e.TokenId).HasColumnName("token_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.ExpiresAt)
                .HasPrecision(0)
                .HasColumnName("expires_at");
            entity.Property(e => e.TokenHash)
                .HasMaxLength(500)
                .HasColumnName("token_hash");
            entity.Property(e => e.UsedAt)
                .HasPrecision(0)
                .HasColumnName("used_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.PasswordResetTokenCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_password_reset_tokens_created_by");

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResetTokenUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_password_reset_tokens_user");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permissions", "auth");

            entity.HasIndex(e => e.PermissionCode, "UQ_permissions_code").IsUnique();

            entity.HasIndex(e => new { e.ModuleCode, e.ActionCode }, "UQ_permissions_module_action").IsUnique();

            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.ActionCode)
                .HasMaxLength(100)
                .HasColumnName("action_code");
            entity.Property(e => e.ActionName)
                .HasMaxLength(255)
                .HasColumnName("action_name");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.ModuleCode)
                .HasMaxLength(100)
                .HasColumnName("module_code");
            entity.Property(e => e.ModuleName)
                .HasMaxLength(255)
                .HasColumnName("module_name");
            entity.Property(e => e.PermissionCode)
                .HasMaxLength(201)
                .HasComputedColumnSql("module_code || '.' || action_code", stored: true)
                .HasColumnName("permission_code");
        });

        modelBuilder.Entity<ProjectDeadline>(entity =>
        {
            entity.HasKey(e => e.DeadlineId);

            entity.ToTable("project_deadlines", "research");

            entity.HasIndex(e => new { e.DueDate, e.DeadlineStatus, e.PriorityLevel }, "IX_project_deadlines_due");

            entity.HasIndex(e => new { e.ProjectId, e.DeadlineStatus }, "IX_project_deadlines_project");

            entity.Property(e => e.DeadlineId).HasColumnName("deadline_id");
            entity.Property(e => e.CompletedAt)
                .HasPrecision(0)
                .HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeadlineDescription).HasColumnName("deadline_description");
            entity.Property(e => e.DeadlineStatus)
                .HasMaxLength(100)
                .HasDefaultValue("open")
                .HasColumnName("deadline_status");
            entity.Property(e => e.DeadlineTitle)
                .HasMaxLength(255)
                .HasColumnName("deadline_title");
            entity.Property(e => e.DeadlineType)
                .HasMaxLength(100)
                .HasColumnName("deadline_type");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.MilestoneId).HasColumnName("milestone_id");
            entity.Property(e => e.PhaseId).HasColumnName("phase_id");
            entity.Property(e => e.PriorityLevel)
                .HasMaxLength(50)
                .HasDefaultValue("normal")
                .HasColumnName("priority_level");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.ResponsibleUserId).HasColumnName("responsible_user_id");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProjectDeadlineCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_project_deadlines_created_by");

            entity.HasOne(d => d.Milestone).WithMany(p => p.ProjectDeadlines)
                .HasForeignKey(d => d.MilestoneId)
                .HasConstraintName("FK_project_deadlines_milestone");

            entity.HasOne(d => d.Phase).WithMany(p => p.ProjectDeadlines)
                .HasForeignKey(d => d.PhaseId)
                .HasConstraintName("FK_project_deadlines_phase");

            entity.HasOne(d => d.Project).WithMany(p => p.ProjectDeadlines)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("FK_project_deadlines_project");

            entity.HasOne(d => d.ResponsibleUser).WithMany(p => p.ProjectDeadlineResponsibleUsers)
                .HasForeignKey(d => d.ResponsibleUserId)
                .HasConstraintName("FK_project_deadlines_responsible");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ProjectDeadlineUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_project_deadlines_updated_by");
        });

        modelBuilder.Entity<ProjectDocument>(entity =>
        {
            entity.HasKey(e => e.DocumentId);

            entity.ToTable("project_documents", "research");

            entity.Property(e => e.DocumentId).HasColumnName("document_id");
            entity.Property(e => e.DocumentTitle)
                .HasMaxLength(255)
                .HasColumnName("document_title");
            entity.Property(e => e.DocumentType)
                .HasMaxLength(100)
                .HasColumnName("document_type");
            entity.Property(e => e.FileName)
                .HasMaxLength(255)
                .HasColumnName("file_name");
            entity.Property(e => e.FileSizeBytes).HasColumnName("file_size_bytes");
            entity.Property(e => e.FileUrl)
                .HasMaxLength(1000)
                .HasColumnName("file_url");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.MilestoneId).HasColumnName("milestone_id");
            entity.Property(e => e.MimeType)
                .HasMaxLength(255)
                .HasColumnName("mime_type");
            entity.Property(e => e.PhaseId).HasColumnName("phase_id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.UploadedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("uploaded_at");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");
            entity.Property(e => e.VersionLabel)
                .HasMaxLength(50)
                .HasColumnName("version_label");

            entity.HasOne(d => d.Milestone).WithMany(p => p.ProjectDocuments)
                .HasForeignKey(d => d.MilestoneId)
                .HasConstraintName("FK_project_documents_milestone");

            entity.HasOne(d => d.Phase).WithMany(p => p.ProjectDocuments)
                .HasForeignKey(d => d.PhaseId)
                .HasConstraintName("FK_project_documents_phase");

            entity.HasOne(d => d.Project).WithMany(p => p.ProjectDocuments)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_project_documents_project");

            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.ProjectDocuments)
                .HasForeignKey(d => d.UploadedBy)
                .HasConstraintName("FK_project_documents_uploaded_by");
        });

        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.ToTable("project_members", "research");

            entity.HasIndex(e => new { e.ProjectId, e.UserId, e.MemberRole }, "UQ_project_members_project_user_role").IsUnique();

            entity.Property(e => e.ProjectMemberId).HasColumnName("project_member_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.JoinedAt)
                .HasDefaultValueSql("CURRENT_DATE")
                .HasColumnName("joined_at");
            entity.Property(e => e.LeftAt).HasColumnName("left_at");
            entity.Property(e => e.MemberRole)
                .HasMaxLength(100)
                .HasColumnName("member_role");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.Responsibility)
                .HasMaxLength(1000)
                .HasColumnName("responsibility");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProjectMemberCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_project_members_created_by");

            entity.HasOne(d => d.Project).WithMany(p => p.ProjectMembers)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_project_members_project");

            entity.HasOne(d => d.User).WithMany(p => p.ProjectMemberUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_project_members_user");
        });

        modelBuilder.Entity<ProjectMilestone>(entity =>
        {
            entity.HasKey(e => e.MilestoneId);

            entity.ToTable("project_milestones", "research");

            entity.HasIndex(e => new { e.DueDate, e.MilestoneStatus, e.PriorityLevel }, "IX_project_milestones_due");

            entity.Property(e => e.MilestoneId).HasColumnName("milestone_id");
            entity.Property(e => e.CompletedDate).HasColumnName("completed_date");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.MilestoneCode)
                .HasMaxLength(100)
                .HasColumnName("milestone_code");
            entity.Property(e => e.MilestoneDescription).HasColumnName("milestone_description");
            entity.Property(e => e.MilestoneName)
                .HasMaxLength(255)
                .HasColumnName("milestone_name");
            entity.Property(e => e.MilestoneStatus)
                .HasMaxLength(100)
                .HasDefaultValue("not_started")
                .HasColumnName("milestone_status");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(e => e.PhaseId).HasColumnName("phase_id");
            entity.Property(e => e.PriorityLevel)
                .HasMaxLength(50)
                .HasDefaultValue("normal")
                .HasColumnName("priority_level");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProjectMilestoneCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_project_milestones_created_by");

            entity.HasOne(d => d.OwnerUser).WithMany(p => p.ProjectMilestoneOwnerUsers)
                .HasForeignKey(d => d.OwnerUserId)
                .HasConstraintName("FK_project_milestones_owner");

            entity.HasOne(d => d.Phase).WithMany(p => p.ProjectMilestones)
                .HasForeignKey(d => d.PhaseId)
                .HasConstraintName("FK_project_milestones_phase");

            entity.HasOne(d => d.Project).WithMany(p => p.ProjectMilestones)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_project_milestones_project");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ProjectMilestoneUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_project_milestones_updated_by");
        });

        modelBuilder.Entity<ProjectPhase>(entity =>
        {
            entity.HasKey(e => e.PhaseId);

            entity.ToTable("project_phases", "research");

            entity.HasIndex(e => new { e.DeadlineDate, e.PhaseStatus }, "IX_project_phases_deadline");

            entity.HasIndex(e => new { e.ProjectId, e.SortOrder, e.PlannedStartDate }, "IX_project_phases_project_sort");

            entity.Property(e => e.PhaseId).HasColumnName("phase_id");
            entity.Property(e => e.ActualEndDate).HasColumnName("actual_end_date");
            entity.Property(e => e.ActualStartDate).HasColumnName("actual_start_date");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeadlineDate).HasColumnName("deadline_date");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(e => e.PhaseCode)
                .HasMaxLength(100)
                .HasColumnName("phase_code");
            entity.Property(e => e.PhaseDescription).HasColumnName("phase_description");
            entity.Property(e => e.PhaseName)
                .HasMaxLength(255)
                .HasColumnName("phase_name");
            entity.Property(e => e.PhaseStatus)
                .HasMaxLength(100)
                .HasDefaultValue("not_started")
                .HasColumnName("phase_status");
            entity.Property(e => e.PlannedEndDate).HasColumnName("planned_end_date");
            entity.Property(e => e.PlannedStartDate).HasColumnName("planned_start_date");
            entity.Property(e => e.ProgressPercent)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("progress_percent");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProjectPhaseCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_project_phases_created_by");

            entity.HasOne(d => d.OwnerUser).WithMany(p => p.ProjectPhaseOwnerUsers)
                .HasForeignKey(d => d.OwnerUserId)
                .HasConstraintName("FK_project_phases_owner");

            entity.HasOne(d => d.Project).WithMany(p => p.ProjectPhases)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_project_phases_project");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ProjectPhaseUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_project_phases_updated_by");
        });

        modelBuilder.Entity<ResearchProject>(entity =>
        {
            entity.HasKey(e => e.ProjectId);

            entity.ToTable("research_projects", "research");

            entity.HasIndex(e => new { e.LeadDepartmentId, e.ProjectStatus }, "IX_research_projects_department");

            entity.HasIndex(e => new { e.EthicsStatus, e.EthicsExpiryDate }, "IX_research_projects_ethics");

            entity.HasIndex(e => new { e.ProjectStatus, e.PlannedStartDate, e.PlannedEndDate }, "IX_research_projects_status_year");

            entity.HasIndex(e => e.ProjectCode, "UQ_research_projects_code").IsUnique();

            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.ActualEndDate).HasColumnName("actual_end_date");
            entity.Property(e => e.ActualStartDate).HasColumnName("actual_start_date");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CurrentPhaseName)
                .HasMaxLength(255)
                .HasColumnName("current_phase_name");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.EthicsApprovalDate).HasColumnName("ethics_approval_date");
            entity.Property(e => e.EthicsApprovalNumber)
                .HasMaxLength(100)
                .HasColumnName("ethics_approval_number");
            entity.Property(e => e.EthicsExpiryDate).HasColumnName("ethics_expiry_date");
            entity.Property(e => e.EthicsStatus)
                .HasMaxLength(100)
                .HasDefaultValue("not_required")
                .HasColumnName("ethics_status");
            entity.Property(e => e.HealthStatus)
                .HasMaxLength(100)
                .HasDefaultValue("on_track")
                .HasColumnName("health_status");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LeadDepartmentId).HasColumnName("lead_department_id");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PlannedEndDate).HasColumnName("planned_end_date");
            entity.Property(e => e.PlannedStartDate).HasColumnName("planned_start_date");
            entity.Property(e => e.PrincipalInvestigatorId).HasColumnName("principal_investigator_id");
            entity.Property(e => e.PriorityLevel)
                .HasMaxLength(50)
                .HasDefaultValue("normal")
                .HasColumnName("priority_level");
            entity.Property(e => e.ProgressPercent)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("progress_percent");
            entity.Property(e => e.ProjectCode)
                .HasMaxLength(100)
                .HasColumnName("project_code");
            entity.Property(e => e.ProjectDescription).HasColumnName("project_description");
            entity.Property(e => e.ProjectStatus)
                .HasMaxLength(100)
                .HasDefaultValue("not_started")
                .HasColumnName("project_status");
            entity.Property(e => e.ProjectTitle)
                .HasMaxLength(500)
                .HasColumnName("project_title");
            entity.Property(e => e.ProtocolNumber)
                .HasMaxLength(100)
                .HasColumnName("protocol_number");
            entity.Property(e => e.ProtocolVersion)
                .HasMaxLength(50)
                .HasColumnName("protocol_version");
            entity.Property(e => e.ResearchType)
                .HasMaxLength(100)
                .HasColumnName("research_type");
            entity.Property(e => e.RiskLevel)
                .HasMaxLength(50)
                .HasDefaultValue("low")
                .HasColumnName("risk_level");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.SponsorId).HasColumnName("sponsor_id");
            entity.Property(e => e.SponsorNameText)
                .HasMaxLength(255)
                .HasColumnName("sponsor_name_text");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ResearchProjectCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_research_projects_created_by");

            entity.HasOne(d => d.LeadDepartment).WithMany(p => p.ResearchProjects)
                .HasForeignKey(d => d.LeadDepartmentId)
                .HasConstraintName("FK_research_projects_department");

            entity.HasOne(d => d.PrincipalInvestigator).WithMany(p => p.ResearchProjectPrincipalInvestigators)
                .HasForeignKey(d => d.PrincipalInvestigatorId)
                .HasConstraintName("FK_research_projects_pi");

            entity.HasOne(d => d.Sponsor).WithMany(p => p.ResearchProjects)
                .HasForeignKey(d => d.SponsorId)
                .HasConstraintName("FK_research_projects_sponsor");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ResearchProjectUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_research_projects_updated_by");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles", "auth");

            entity.HasIndex(e => e.RoleCode, "UQ_roles_code").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsSystem).HasColumnName("is_system");
            entity.Property(e => e.RoleCode)
                .HasMaxLength(100)
                .HasColumnName("role_code");
            entity.Property(e => e.RoleName)
                .HasMaxLength(255)
                .HasColumnName("role_name");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("role_permissions", "auth");

            entity.HasIndex(e => new { e.RoleId, e.PermissionId }, "IX_role_permissions_role");

            entity.HasIndex(e => new { e.RoleId, e.PermissionId }, "UQ_role_permissions_role_permission").IsUnique();

            entity.Property(e => e.RolePermissionId).HasColumnName("role_permission_id");
            entity.Property(e => e.AssignedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("assigned_at");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.IsAllowed)
                .HasDefaultValue(true)
                .HasColumnName("is_allowed");
            entity.Property(e => e.PermissionId).HasColumnName("permission_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");

            entity.HasOne(d => d.AssignedByNavigation).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.AssignedBy)
                .HasConstraintName("FK_role_permissions_assigned_by");

            entity.HasOne(d => d.Permission).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.PermissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_role_permissions_permission");

            entity.HasOne(d => d.Role).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_role_permissions_role");
        });

        modelBuilder.Entity<Sponsor>(entity =>
        {
            entity.ToTable("sponsors", "research");

            entity.HasIndex(e => e.SponsorCode, "UQ_sponsors_code").IsUnique();

            entity.Property(e => e.SponsorId).HasColumnName("sponsor_id");
            entity.Property(e => e.Address)
                .HasMaxLength(1000)
                .HasColumnName("address");
            entity.Property(e => e.ContactEmail)
                .HasMaxLength(255)
                .HasColumnName("contact_email");
            entity.Property(e => e.ContactPerson)
                .HasMaxLength(255)
                .HasColumnName("contact_person");
            entity.Property(e => e.ContactPhone)
                .HasMaxLength(50)
                .HasColumnName("contact_phone");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.SponsorCode)
                .HasMaxLength(100)
                .HasColumnName("sponsor_code");
            entity.Property(e => e.SponsorName)
                .HasMaxLength(255)
                .HasColumnName("sponsor_name");
            entity.Property(e => e.SponsorType)
                .HasMaxLength(100)
                .HasColumnName("sponsor_type");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.SponsorCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_sponsors_created_by");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.SponsorUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_sponsors_updated_by");
        });

        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasKey(e => e.SettingId);

            entity.ToTable("system_settings", "ref");

            entity.HasIndex(e => e.SettingKey, "UQ_system_settings_key").IsUnique();

            entity.Property(e => e.SettingId).HasColumnName("setting_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsPublic).HasColumnName("is_public");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.SettingGroup)
                .HasMaxLength(100)
                .HasDefaultValue("general")
                .HasColumnName("setting_group");
            entity.Property(e => e.SettingKey)
                .HasMaxLength(150)
                .HasColumnName("setting_key");
            entity.Property(e => e.SettingName)
                .HasMaxLength(255)
                .HasColumnName("setting_name");
            entity.Property(e => e.SettingValue).HasColumnName("setting_value");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.ValueType)
                .HasMaxLength(50)
                .HasDefaultValue("string")
                .HasColumnName("value_type");
        });

        modelBuilder.Entity<TrainingEvent>(entity =>
        {
            entity.HasKey(e => e.EventId);

            entity.ToTable("training_events", "training");

            entity.HasIndex(e => new { e.PlannedDate, e.EventStatus, e.PlanType }, "IX_training_events_date_status");

            entity.HasIndex(e => new { e.DepartmentId, e.EventYear, e.EventMonth }, "IX_training_events_department");

            entity.HasIndex(e => new { e.EventYear, e.EventMonth }, "IX_training_events_year_month");

            entity.HasIndex(e => e.EventCode, "UQ_training_events_code").IsUnique();

            entity.Property(e => e.EventId).HasColumnName("event_id");
            entity.Property(e => e.ActualAttendees).HasColumnName("actual_attendees");
            entity.Property(e => e.ActualDate).HasColumnName("actual_date");
            entity.Property(e => e.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.DeliveryMode)
                .HasMaxLength(100)
                .HasDefaultValue("offline")
                .HasColumnName("delivery_mode");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.EndTime)
                .HasPrecision(0)
                .HasColumnName("end_time");
            entity.Property(e => e.EventCode)
                .HasMaxLength(100)
                .HasColumnName("event_code");
            entity.Property(e => e.EventDescription).HasColumnName("event_description");
            entity.Property(e => e.EventMonth).HasColumnName("event_month");
            entity.Property(e => e.EventStatus)
                .HasMaxLength(100)
                .HasDefaultValue("planned")
                .HasColumnName("event_status");
            entity.Property(e => e.EventTitle)
                .HasMaxLength(500)
                .HasColumnName("event_title");
            entity.Property(e => e.EventType)
                .HasMaxLength(100)
                .HasColumnName("event_type");
            entity.Property(e => e.EventYear).HasColumnName("event_year");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Location)
                .HasMaxLength(500)
                .HasColumnName("location");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.PlanType)
                .HasMaxLength(100)
                .HasColumnName("plan_type");
            entity.Property(e => e.PlannedAttendees).HasColumnName("planned_attendees");
            entity.Property(e => e.PlannedDate).HasColumnName("planned_date");
            entity.Property(e => e.ResponsibleUserId).HasColumnName("responsible_user_id");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.StartTime)
                .HasPrecision(0)
                .HasColumnName("start_time");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Category).WithMany(p => p.TrainingEvents)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_training_events_category");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.TrainingEventCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_training_events_created_by");

            entity.HasOne(d => d.Department).WithMany(p => p.TrainingEvents)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_training_events_department");

            entity.HasOne(d => d.ResponsibleUser).WithMany(p => p.TrainingEventResponsibleUsers)
                .HasForeignKey(d => d.ResponsibleUserId)
                .HasConstraintName("FK_training_events_responsible");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.TrainingEventUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_training_events_updated_by");
        });

        modelBuilder.Entity<TrainingEventLog>(entity =>
        {
            entity.HasKey(e => e.EventLogId);

            entity.ToTable("training_event_logs", "training");

            entity.Property(e => e.EventLogId).HasColumnName("event_log_id");
            entity.Property(e => e.ActionType)
                .HasMaxLength(100)
                .HasColumnName("action_type");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.EventId).HasColumnName("event_id");
            entity.Property(e => e.NewValueJson)
                .HasColumnType("jsonb")
                .HasColumnName("new_value_json");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.OldValueJson)
                .HasColumnType("jsonb")
                .HasColumnName("old_value_json");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.TrainingEventLogs)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_training_event_logs_created_by");

            entity.HasOne(d => d.Event).WithMany(p => p.TrainingEventLogs)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_training_event_logs_event");
        });

        modelBuilder.Entity<TrainingEventParticipant>(entity =>
        {
            entity.HasKey(e => e.ParticipantId);

            entity.ToTable("training_event_participants", "training");

            entity.Property(e => e.ParticipantId).HasColumnName("participant_id");
            entity.Property(e => e.AttendanceStatus)
                .HasMaxLength(50)
                .HasDefaultValue("registered")
                .HasColumnName("attendance_status");
            entity.Property(e => e.CheckedInAt)
                .HasPrecision(0)
                .HasColumnName("checked_in_at");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.EventId).HasColumnName("event_id");
            entity.Property(e => e.Notes)
                .HasMaxLength(1000)
                .HasColumnName("notes");
            entity.Property(e => e.ParticipantEmail)
                .HasMaxLength(255)
                .HasColumnName("participant_email");
            entity.Property(e => e.ParticipantName)
                .HasMaxLength(255)
                .HasColumnName("participant_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.TrainingEventParticipantCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_training_event_participants_created_by");

            entity.HasOne(d => d.Department).WithMany(p => p.TrainingEventParticipants)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_training_event_participants_department");

            entity.HasOne(d => d.Event).WithMany(p => p.TrainingEventParticipants)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_training_event_participants_event");

            entity.HasOne(d => d.User).WithMany(p => p.TrainingEventParticipantUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_training_event_participants_user");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "auth");

            entity.HasIndex(e => new { e.DepartmentId, e.AccountStatus }, "IX_users_department_status");

            entity.HasIndex(e => e.Email, "UQ_users_email").IsUnique();

            entity.HasIndex(e => e.Username, "UQ_users_username").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.AccountStatus)
                .HasMaxLength(50)
                .HasDefaultValue("active")
                .HasColumnName("account_status");
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(1000)
                .HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.EmailConfirmed).HasColumnName("email_confirmed");
            entity.Property(e => e.FailedLoginCount).HasColumnName("failed_login_count");
            entity.Property(e => e.FullName)
                .HasMaxLength(255)
                .HasColumnName("full_name");
            entity.Property(e => e.Initials)
                .HasMaxLength(20)
                .HasColumnName("initials");
            entity.Property(e => e.IsSystemAdmin).HasColumnName("is_system_admin");
            entity.Property(e => e.LastLoginAt)
                .HasPrecision(0)
                .HasColumnName("last_login_at");
            entity.Property(e => e.LastLoginIp)
                .HasMaxLength(100)
                .HasColumnName("last_login_ip");
            entity.Property(e => e.LockedUntil)
                .HasPrecision(0)
                .HasColumnName("locked_until");
            entity.Property(e => e.MustChangePassword).HasColumnName("must_change_password");
            entity.Property(e => e.PasswordChangedAt)
                .HasPrecision(0)
                .HasColumnName("password_changed_at");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(500)
                .HasColumnName("password_hash");
            entity.Property(e => e.PasswordSalt)
                .HasMaxLength(500)
                .HasColumnName("password_salt");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(50)
                .HasColumnName("phone_number");
            entity.Property(e => e.RowVersion)
                .IsConcurrencyToken()
                .HasDefaultValue(1L)
                .HasColumnName("row_version");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.Username)
                .HasMaxLength(100)
                .HasColumnName("username");

            entity.HasOne(d => d.Department).WithMany(p => p.Users)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK_users_department");
        });

        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.HasKey(e => e.PreferenceId);

            entity.ToTable("user_preferences", "auth");

            entity.HasIndex(e => e.UserId, "UQ_user_preferences_user").IsUnique();

            entity.Property(e => e.PreferenceId).HasColumnName("preference_id");
            entity.Property(e => e.AppearanceMode)
                .HasMaxLength(50)
                .HasDefaultValue("system")
                .HasColumnName("appearance_mode");
            entity.Property(e => e.AutoMarkReadOnOpen).HasColumnName("auto_mark_read_on_open");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.EnableEmailNotification).HasColumnName("enable_email_notification");
            entity.Property(e => e.EnableInAppNotification)
                .HasDefaultValue(true)
                .HasColumnName("enable_in_app_notification");
            entity.Property(e => e.LanguageCode)
                .HasMaxLength(20)
                .HasDefaultValue("vi-VN")
                .HasColumnName("language_code");
            entity.Property(e => e.ReceiveDeadlineNotification)
                .HasDefaultValue(true)
                .HasColumnName("receive_deadline_notification");
            entity.Property(e => e.ReceiveEthicsNotification)
                .HasDefaultValue(true)
                .HasColumnName("receive_ethics_notification");
            entity.Property(e => e.ReceiveTrainingNotification)
                .HasDefaultValue(true)
                .HasColumnName("receive_training_notification");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.UserPreference)
                .HasForeignKey<UserPreference>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_user_preferences_user");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles", "auth");

            entity.HasIndex(e => new { e.UserId, e.IsActive }, "IX_user_roles_user_active");

            entity.HasIndex(e => new { e.UserId, e.RoleId }, "UQ_user_roles_user_role").IsUnique();

            entity.Property(e => e.UserRoleId).HasColumnName("user_role_id");
            entity.Property(e => e.AssignedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("assigned_at");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.AssignedByNavigation).WithMany(p => p.UserRoleAssignedByNavigations)
                .HasForeignKey(d => d.AssignedBy)
                .HasConstraintName("FK_user_roles_assigned_by");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_user_roles_role");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoleUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_user_roles_user");
        });

        modelBuilder.Entity<VResearchProjectOverview>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_research_project_overview", "research");

            entity.Property(e => e.CurrentPhaseName)
                .HasMaxLength(255)
                .HasColumnName("current_phase_name");
            entity.Property(e => e.EthicsExpiryDate).HasColumnName("ethics_expiry_date");
            entity.Property(e => e.EthicsStatus)
                .HasMaxLength(100)
                .HasColumnName("ethics_status");
            entity.Property(e => e.HealthStatus)
                .HasMaxLength(100)
                .HasColumnName("health_status");
            entity.Property(e => e.IsEthicsExpired).HasColumnName("is_ethics_expired");
            entity.Property(e => e.IsEthicsExpiringSoon).HasColumnName("is_ethics_expiring_soon");
            entity.Property(e => e.LeadDepartmentName)
                .HasMaxLength(255)
                .HasColumnName("lead_department_name");
            entity.Property(e => e.NextDueDate).HasColumnName("next_due_date");
            entity.Property(e => e.NextDueTitle)
                .HasMaxLength(255)
                .HasColumnName("next_due_title");
            entity.Property(e => e.PlannedEndDate).HasColumnName("planned_end_date");
            entity.Property(e => e.PlannedStartDate).HasColumnName("planned_start_date");
            entity.Property(e => e.PrincipalInvestigatorName)
                .HasMaxLength(255)
                .HasColumnName("principal_investigator_name");
            entity.Property(e => e.ProgressPercent)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("progress_percent");
            entity.Property(e => e.ProjectCode)
                .HasMaxLength(100)
                .HasColumnName("project_code");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.ProjectStatus)
                .HasMaxLength(100)
                .HasColumnName("project_status");
            entity.Property(e => e.ProjectTitle)
                .HasMaxLength(500)
                .HasColumnName("project_title");
            entity.Property(e => e.ProtocolNumber)
                .HasMaxLength(100)
                .HasColumnName("protocol_number");
            entity.Property(e => e.ProtocolVersion)
                .HasMaxLength(50)
                .HasColumnName("protocol_version");
            entity.Property(e => e.RiskLevel)
                .HasMaxLength(50)
                .HasColumnName("risk_level");
            entity.Property(e => e.SponsorName)
                .HasMaxLength(255)
                .HasColumnName("sponsor_name");
        });

        modelBuilder.Entity<VTrainingMonthlySummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_training_monthly_summary", "training");

            entity.Property(e => e.ActualCount).HasColumnName("actual_count");
            entity.Property(e => e.AdditionalCount).HasColumnName("additional_count");
            entity.Property(e => e.CompletionRate)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("completion_rate");
            entity.Property(e => e.EventMonth).HasColumnName("event_month");
            entity.Property(e => e.EventYear).HasColumnName("event_year");
            entity.Property(e => e.NotCompletedCount).HasColumnName("not_completed_count");
            entity.Property(e => e.PlannedCount).HasColumnName("planned_count");
            entity.Property(e => e.TotalPlanCount).HasColumnName("total_plan_count");
        });

        modelBuilder.Entity<VUserNotificationInbox>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_user_notification_inbox", "notify");

            entity.Property(e => e.ActionUrl)
                .HasMaxLength(1000)
                .HasColumnName("action_url");
            entity.Property(e => e.Category)
                .HasMaxLength(100)
                .HasColumnName("category");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasColumnName("created_at");
            entity.Property(e => e.DismissedAt)
                .HasPrecision(0)
                .HasColumnName("dismissed_at");
            entity.Property(e => e.IsDismissed).HasColumnName("is_dismissed");
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.NotificationRecipientId).HasColumnName("notification_recipient_id");
            entity.Property(e => e.NotificationType)
                .HasMaxLength(100)
                .HasColumnName("notification_type");
            entity.Property(e => e.PriorityLevel)
                .HasMaxLength(50)
                .HasColumnName("priority_level");
            entity.Property(e => e.ReadAt)
                .HasPrecision(0)
                .HasColumnName("read_at");
            entity.Property(e => e.RelatedEntityCode)
                .HasMaxLength(100)
                .HasColumnName("related_entity_code");
            entity.Property(e => e.RelatedEntityId).HasColumnName("related_entity_id");
            entity.Property(e => e.RelatedEntityType)
                .HasMaxLength(100)
                .HasColumnName("related_entity_type");
            entity.Property(e => e.SuggestedAction)
                .HasMaxLength(255)
                .HasColumnName("suggested_action");
            entity.Property(e => e.Title)
                .HasMaxLength(500)
                .HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

