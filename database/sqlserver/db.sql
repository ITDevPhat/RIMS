/*
  RMS Hospital Research Management System - SQL Server DDL
  Scope: UI-backed MVP database for research tracking, training event management,
         notifications, settings, users, roles, permissions, audit and login logs.
  Target: Microsoft SQL Server 2019+
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   0. DATABASE
   ========================================================= */
IF DB_ID(N'RMS') IS NULL
BEGIN
    CREATE DATABASE RMS;
END
GO

USE RMS;
GO

/* =========================================================
   1. SCHEMAS
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'auth') EXEC(N'CREATE SCHEMA auth');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'ref') EXEC(N'CREATE SCHEMA ref');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'research') EXEC(N'CREATE SCHEMA research');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'training') EXEC(N'CREATE SCHEMA training');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'notify') EXEC(N'CREATE SCHEMA notify');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'audit') EXEC(N'CREATE SCHEMA audit');
GO

/* =========================================================
   2. COMMON REFERENCE TABLES
   ========================================================= */
CREATE TABLE ref.departments (
    department_id       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_departments PRIMARY KEY,
    department_code     NVARCHAR(50) NOT NULL,
    department_name     NVARCHAR(255) NOT NULL,
    parent_department_id BIGINT NULL,
    department_type     NVARCHAR(100) NULL, -- Khoa, Phòng, Trung tâm, Bộ môn...
    description         NVARCHAR(1000) NULL,
    is_active           BIT NOT NULL CONSTRAINT DF_departments_is_active DEFAULT (1),
    sort_order          INT NOT NULL CONSTRAINT DF_departments_sort_order DEFAULT (0),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_departments_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2(0) NULL,
    deleted_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT UQ_departments_code UNIQUE (department_code),
    CONSTRAINT FK_departments_parent FOREIGN KEY (parent_department_id) REFERENCES ref.departments(department_id)
);
GO

CREATE TABLE ref.lookup_groups (
    lookup_group_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_lookup_groups PRIMARY KEY,
    group_code      NVARCHAR(100) NOT NULL,
    group_name      NVARCHAR(255) NOT NULL,
    description     NVARCHAR(1000) NULL,
    is_active       BIT NOT NULL CONSTRAINT DF_lookup_groups_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_lookup_groups_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_lookup_groups_code UNIQUE (group_code)
);
GO

CREATE TABLE ref.lookup_values (
    lookup_value_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_lookup_values PRIMARY KEY,
    lookup_group_id BIGINT NOT NULL,
    value_code      NVARCHAR(100) NOT NULL,
    value_name      NVARCHAR(255) NOT NULL,
    value_name_en   NVARCHAR(255) NULL,
    description     NVARCHAR(1000) NULL,
    color_class     NVARCHAR(100) NULL,
    icon_name       NVARCHAR(100) NULL,
    sort_order      INT NOT NULL CONSTRAINT DF_lookup_values_sort_order DEFAULT (0),
    is_system       BIT NOT NULL CONSTRAINT DF_lookup_values_is_system DEFAULT (0),
    is_active       BIT NOT NULL CONSTRAINT DF_lookup_values_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_lookup_values_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_lookup_values_group FOREIGN KEY (lookup_group_id) REFERENCES ref.lookup_groups(lookup_group_id),
    CONSTRAINT UQ_lookup_values_group_code UNIQUE (lookup_group_id, value_code)
);
GO

CREATE TABLE ref.system_settings (
    setting_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_system_settings PRIMARY KEY,
    setting_key     NVARCHAR(150) NOT NULL,
    setting_value   NVARCHAR(MAX) NULL,
    value_type      NVARCHAR(50) NOT NULL CONSTRAINT DF_system_settings_value_type DEFAULT N'string', -- string, number, boolean, json
    setting_group   NVARCHAR(100) NOT NULL CONSTRAINT DF_system_settings_group DEFAULT N'general',
    setting_name    NVARCHAR(255) NOT NULL,
    description     NVARCHAR(1000) NULL,
    is_public       BIT NOT NULL CONSTRAINT DF_system_settings_is_public DEFAULT (0),
    is_active       BIT NOT NULL CONSTRAINT DF_system_settings_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_system_settings_created_at DEFAULT SYSUTCDATETIME(),
    created_by      BIGINT NULL,
    updated_at      DATETIME2(0) NULL,
    updated_by      BIGINT NULL,
    row_version     ROWVERSION NOT NULL,
    CONSTRAINT UQ_system_settings_key UNIQUE (setting_key)
);
GO

/* =========================================================
   3. AUTH / USER / ROLE / PERMISSION
   ========================================================= */
CREATE TABLE auth.users (
    user_id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
    username            NVARCHAR(100) NOT NULL,
    email               NVARCHAR(255) NOT NULL,
    password_hash       NVARCHAR(500) NULL,
    password_salt       NVARCHAR(500) NULL,
    full_name           NVARCHAR(255) NOT NULL,
    initials            NVARCHAR(20) NULL,
    phone_number        NVARCHAR(50) NULL,
    avatar_url          NVARCHAR(1000) NULL,
    title               NVARCHAR(255) NULL, -- Chức vụ
    department_id       BIGINT NULL,
    account_status      NVARCHAR(50) NOT NULL CONSTRAINT DF_users_status DEFAULT N'active', -- active, locked, pending_activation, disabled
    is_system_admin     BIT NOT NULL CONSTRAINT DF_users_is_system_admin DEFAULT (0),
    email_confirmed     BIT NOT NULL CONSTRAINT DF_users_email_confirmed DEFAULT (0),
    must_change_password BIT NOT NULL CONSTRAINT DF_users_must_change_password DEFAULT (0),
    failed_login_count  INT NOT NULL CONSTRAINT DF_users_failed_login_count DEFAULT (0),
    locked_until        DATETIME2(0) NULL,
    last_login_at       DATETIME2(0) NULL,
    last_login_ip       NVARCHAR(100) NULL,
    password_changed_at DATETIME2(0) NULL,
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2(0) NULL,
    deleted_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT UQ_users_username UNIQUE (username),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_account_status CHECK (account_status IN (N'active', N'locked', N'pending_activation', N'disabled')),
    CONSTRAINT FK_users_department FOREIGN KEY (department_id) REFERENCES ref.departments(department_id)
);
GO

CREATE TABLE auth.roles (
    role_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_roles PRIMARY KEY,
    role_code       NVARCHAR(100) NOT NULL,
    role_name       NVARCHAR(255) NOT NULL,
    description     NVARCHAR(1000) NULL,
    is_system       BIT NOT NULL CONSTRAINT DF_roles_is_system DEFAULT (0),
    is_active       BIT NOT NULL CONSTRAINT DF_roles_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_roles_created_at DEFAULT SYSUTCDATETIME(),
    created_by      BIGINT NULL,
    updated_at      DATETIME2(0) NULL,
    updated_by      BIGINT NULL,
    deleted_at      DATETIME2(0) NULL,
    deleted_by      BIGINT NULL,
    row_version     ROWVERSION NOT NULL,
    CONSTRAINT UQ_roles_code UNIQUE (role_code)
);
GO

CREATE TABLE auth.permissions (
    permission_id   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_permissions PRIMARY KEY,
    module_code     NVARCHAR(100) NOT NULL, -- dashboard, research_project, training_event, notification, setting...
    module_name     NVARCHAR(255) NOT NULL,
    action_code     NVARCHAR(100) NOT NULL, -- view, create, update, delete, approve, export, configure
    action_name     NVARCHAR(255) NOT NULL,
    permission_code AS (CONVERT(NVARCHAR(201), module_code + N'.' + action_code)) PERSISTED,
    description     NVARCHAR(1000) NULL,
    is_active       BIT NOT NULL CONSTRAINT DF_permissions_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_permissions_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_permissions_module_action UNIQUE (module_code, action_code),
    CONSTRAINT UQ_permissions_code UNIQUE (permission_code)
);
GO

CREATE TABLE auth.user_roles (
    user_role_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_roles PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    role_id         BIGINT NOT NULL,
    assigned_at     DATETIME2(0) NOT NULL CONSTRAINT DF_user_roles_assigned_at DEFAULT SYSUTCDATETIME(),
    assigned_by     BIGINT NULL,
    is_active       BIT NOT NULL CONSTRAINT DF_user_roles_is_active DEFAULT (1),
    CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_user_roles_role FOREIGN KEY (role_id) REFERENCES auth.roles(role_id),
    CONSTRAINT FK_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES auth.users(user_id),
    CONSTRAINT UQ_user_roles_user_role UNIQUE (user_id, role_id)
);
GO

CREATE TABLE auth.role_permissions (
    role_permission_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_role_permissions PRIMARY KEY,
    role_id            BIGINT NOT NULL,
    permission_id      BIGINT NOT NULL,
    is_allowed         BIT NOT NULL CONSTRAINT DF_role_permissions_is_allowed DEFAULT (1),
    assigned_at        DATETIME2(0) NOT NULL CONSTRAINT DF_role_permissions_assigned_at DEFAULT SYSUTCDATETIME(),
    assigned_by        BIGINT NULL,
    CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES auth.roles(role_id),
    CONSTRAINT FK_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES auth.permissions(permission_id),
    CONSTRAINT FK_role_permissions_assigned_by FOREIGN KEY (assigned_by) REFERENCES auth.users(user_id),
    CONSTRAINT UQ_role_permissions_role_permission UNIQUE (role_id, permission_id)
);
GO

CREATE TABLE auth.user_preferences (
    preference_id       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_preferences PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    appearance_mode     NVARCHAR(50) NOT NULL CONSTRAINT DF_user_preferences_appearance DEFAULT N'system', -- light, dark, system
    language_code       NVARCHAR(20) NOT NULL CONSTRAINT DF_user_preferences_lang DEFAULT N'vi-VN',
    enable_in_app_notification BIT NOT NULL CONSTRAINT DF_user_preferences_in_app DEFAULT (1),
    enable_email_notification  BIT NOT NULL CONSTRAINT DF_user_preferences_email DEFAULT (0),
    receive_deadline_notification BIT NOT NULL CONSTRAINT DF_user_preferences_deadline DEFAULT (1),
    receive_training_notification BIT NOT NULL CONSTRAINT DF_user_preferences_training DEFAULT (1),
    receive_ethics_notification BIT NOT NULL CONSTRAINT DF_user_preferences_ethics DEFAULT (1),
    auto_mark_read_on_open BIT NOT NULL CONSTRAINT DF_user_preferences_auto_read DEFAULT (0),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_user_preferences_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0) NULL,
    CONSTRAINT FK_user_preferences_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT UQ_user_preferences_user UNIQUE (user_id),
    CONSTRAINT CK_user_preferences_appearance CHECK (appearance_mode IN (N'light', N'dark', N'system'))
);
GO

CREATE TABLE auth.password_reset_tokens (
    token_id        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_password_reset_tokens PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token_hash      NVARCHAR(500) NOT NULL,
    expires_at      DATETIME2(0) NOT NULL,
    used_at         DATETIME2(0) NULL,
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_password_reset_tokens_created_at DEFAULT SYSUTCDATETIME(),
    created_by      BIGINT NULL,
    CONSTRAINT FK_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_password_reset_tokens_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id)
);
GO

CREATE TABLE auth.login_sessions (
    session_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_login_sessions PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    session_token_hash NVARCHAR(500) NULL,
    ip_address      NVARCHAR(100) NULL,
    user_agent      NVARCHAR(1000) NULL,
    device_name     NVARCHAR(255) NULL,
    login_at        DATETIME2(0) NOT NULL CONSTRAINT DF_login_sessions_login_at DEFAULT SYSUTCDATETIME(),
    expires_at      DATETIME2(0) NULL,
    logout_at       DATETIME2(0) NULL,
    logout_reason   NVARCHAR(255) NULL,
    is_active       BIT NOT NULL CONSTRAINT DF_login_sessions_is_active DEFAULT (1),
    CONSTRAINT FK_login_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id)
);
GO

CREATE TABLE audit.login_events (
    login_event_id  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_login_events PRIMARY KEY,
    user_id         BIGINT NULL,
    username_or_email NVARCHAR(255) NULL,
    event_type      NVARCHAR(50) NOT NULL, -- login_success, login_failed, logout, lockout, password_changed
    success         BIT NOT NULL,
    ip_address      NVARCHAR(100) NULL,
    user_agent      NVARCHAR(1000) NULL,
    failure_reason  NVARCHAR(1000) NULL,
    occurred_at     DATETIME2(0) NOT NULL CONSTRAINT DF_login_events_occurred_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_login_events_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT CK_login_events_type CHECK (event_type IN (N'login_success', N'login_failed', N'logout', N'lockout', N'password_changed', N'password_reset'))
);
GO

/* =========================================================
   4. RESEARCH MANAGEMENT
   ========================================================= */
CREATE TABLE research.sponsors (
    sponsor_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sponsors PRIMARY KEY,
    sponsor_code    NVARCHAR(100) NOT NULL,
    sponsor_name    NVARCHAR(255) NOT NULL,
    sponsor_type    NVARCHAR(100) NULL, -- Nội bộ, Đại học, Công ty, Tổ chức quốc tế...
    contact_person  NVARCHAR(255) NULL,
    contact_email   NVARCHAR(255) NULL,
    contact_phone   NVARCHAR(50) NULL,
    address         NVARCHAR(1000) NULL,
    is_active       BIT NOT NULL CONSTRAINT DF_sponsors_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_sponsors_created_at DEFAULT SYSUTCDATETIME(),
    created_by      BIGINT NULL,
    updated_at      DATETIME2(0) NULL,
    updated_by      BIGINT NULL,
    deleted_at      DATETIME2(0) NULL,
    deleted_by      BIGINT NULL,
    row_version     ROWVERSION NOT NULL,
    CONSTRAINT UQ_sponsors_code UNIQUE (sponsor_code),
    CONSTRAINT FK_sponsors_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_sponsors_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id)
);
GO

CREATE TABLE research.research_projects (
    project_id                  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_research_projects PRIMARY KEY,
    project_code                NVARCHAR(100) NOT NULL,
    project_title               NVARCHAR(500) NOT NULL,
    project_description         NVARCHAR(MAX) NULL,
    lead_department_id          BIGINT NULL,
    principal_investigator_id   BIGINT NULL,
    sponsor_id                  BIGINT NULL,
    sponsor_name_text           NVARCHAR(255) NULL,
    research_type               NVARCHAR(100) NULL,
    protocol_number             NVARCHAR(100) NULL,
    protocol_version            NVARCHAR(50) NULL,
    ethics_status               NVARCHAR(100) NOT NULL CONSTRAINT DF_research_projects_ethics_status DEFAULT N'not_required',
    ethics_approval_number      NVARCHAR(100) NULL,
    ethics_approval_date        DATE NULL,
    ethics_expiry_date          DATE NULL,
    planned_start_date          DATE NULL,
    planned_end_date            DATE NULL,
    actual_start_date           DATE NULL,
    actual_end_date             DATE NULL,
    current_phase_name          NVARCHAR(255) NULL,
    progress_percent            DECIMAL(5,2) NOT NULL CONSTRAINT DF_research_projects_progress DEFAULT (0),
    project_status              NVARCHAR(100) NOT NULL CONSTRAINT DF_research_projects_status DEFAULT N'not_started',
    health_status               NVARCHAR(100) NOT NULL CONSTRAINT DF_research_projects_health DEFAULT N'on_track',
    risk_level                  NVARCHAR(50) NOT NULL CONSTRAINT DF_research_projects_risk DEFAULT N'low',
    priority_level              NVARCHAR(50) NOT NULL CONSTRAINT DF_research_projects_priority DEFAULT N'normal',
    notes                       NVARCHAR(MAX) NULL,
    is_active                   BIT NOT NULL CONSTRAINT DF_research_projects_is_active DEFAULT (1),
    created_at                  DATETIME2(0) NOT NULL CONSTRAINT DF_research_projects_created_at DEFAULT SYSUTCDATETIME(),
    created_by                  BIGINT NULL,
    updated_at                  DATETIME2(0) NULL,
    updated_by                  BIGINT NULL,
    deleted_at                  DATETIME2(0) NULL,
    deleted_by                  BIGINT NULL,
    row_version                 ROWVERSION NOT NULL,
    CONSTRAINT UQ_research_projects_code UNIQUE (project_code),
    CONSTRAINT FK_research_projects_department FOREIGN KEY (lead_department_id) REFERENCES ref.departments(department_id),
    CONSTRAINT FK_research_projects_pi FOREIGN KEY (principal_investigator_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_research_projects_sponsor FOREIGN KEY (sponsor_id) REFERENCES research.sponsors(sponsor_id),
    CONSTRAINT FK_research_projects_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_research_projects_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_research_projects_progress CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT CK_research_projects_ethics_status CHECK (ethics_status IN (N'not_required', N'pending', N'approved', N'expiring_soon', N'expired', N'rejected')),
    CONSTRAINT CK_research_projects_status CHECK (project_status IN (N'not_started', N'in_progress', N'completed', N'at_risk', N'overdue', N'on_hold', N'cancelled')),
    CONSTRAINT CK_research_projects_health CHECK (health_status IN (N'on_track', N'at_risk', N'overdue', N'on_hold', N'completed')),
    CONSTRAINT CK_research_projects_risk CHECK (risk_level IN (N'low', N'medium', N'high', N'critical')),
    CONSTRAINT CK_research_projects_priority CHECK (priority_level IN (N'low', N'normal', N'high', N'urgent'))
);
GO

CREATE TABLE research.project_members (
    project_member_id   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_members PRIMARY KEY,
    project_id          BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    member_role         NVARCHAR(100) NOT NULL, -- PI, Co-PI, Coordinator, Member, Viewer
    responsibility      NVARCHAR(1000) NULL,
    joined_at           DATE NOT NULL CONSTRAINT DF_project_members_joined_at DEFAULT CONVERT(DATE, SYSUTCDATETIME()),
    left_at             DATE NULL,
    is_active           BIT NOT NULL CONSTRAINT DF_project_members_is_active DEFAULT (1),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_project_members_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    CONSTRAINT FK_project_members_project FOREIGN KEY (project_id) REFERENCES research.research_projects(project_id),
    CONSTRAINT FK_project_members_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_members_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT UQ_project_members_project_user_role UNIQUE (project_id, user_id, member_role)
);
GO

CREATE TABLE research.project_phases (
    phase_id                BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_phases PRIMARY KEY,
    project_id              BIGINT NOT NULL,
    phase_code              NVARCHAR(100) NULL,
    phase_name              NVARCHAR(255) NOT NULL,
    phase_description       NVARCHAR(MAX) NULL,
    owner_user_id           BIGINT NULL,
    planned_start_date      DATE NULL,
    planned_end_date        DATE NULL,
    deadline_date           DATE NULL,
    actual_start_date       DATE NULL,
    actual_end_date         DATE NULL,
    progress_percent        DECIMAL(5,2) NOT NULL CONSTRAINT DF_project_phases_progress DEFAULT (0),
    phase_status            NVARCHAR(100) NOT NULL CONSTRAINT DF_project_phases_status DEFAULT N'not_started',
    sort_order              INT NOT NULL CONSTRAINT DF_project_phases_sort_order DEFAULT (0),
    notes                   NVARCHAR(MAX) NULL,
    is_active               BIT NOT NULL CONSTRAINT DF_project_phases_is_active DEFAULT (1),
    created_at              DATETIME2(0) NOT NULL CONSTRAINT DF_project_phases_created_at DEFAULT SYSUTCDATETIME(),
    created_by              BIGINT NULL,
    updated_at              DATETIME2(0) NULL,
    updated_by              BIGINT NULL,
    deleted_at              DATETIME2(0) NULL,
    deleted_by              BIGINT NULL,
    row_version             ROWVERSION NOT NULL,
    CONSTRAINT FK_project_phases_project FOREIGN KEY (project_id) REFERENCES research.research_projects(project_id),
    CONSTRAINT FK_project_phases_owner FOREIGN KEY (owner_user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_phases_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_phases_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_project_phases_progress CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT CK_project_phases_status CHECK (phase_status IN (N'not_started', N'in_progress', N'completed', N'at_risk', N'overdue', N'on_hold'))
);
GO

CREATE TABLE research.project_milestones (
    milestone_id        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_milestones PRIMARY KEY,
    project_id          BIGINT NOT NULL,
    phase_id            BIGINT NULL,
    milestone_code      NVARCHAR(100) NULL,
    milestone_name      NVARCHAR(255) NOT NULL,
    milestone_description NVARCHAR(MAX) NULL,
    due_date            DATE NOT NULL,
    completed_date      DATE NULL,
    owner_user_id       BIGINT NULL,
    milestone_status    NVARCHAR(100) NOT NULL CONSTRAINT DF_project_milestones_status DEFAULT N'not_started',
    priority_level      NVARCHAR(50) NOT NULL CONSTRAINT DF_project_milestones_priority DEFAULT N'normal',
    notes               NVARCHAR(MAX) NULL,
    is_active           BIT NOT NULL CONSTRAINT DF_project_milestones_is_active DEFAULT (1),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_project_milestones_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2(0) NULL,
    deleted_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT FK_project_milestones_project FOREIGN KEY (project_id) REFERENCES research.research_projects(project_id),
    CONSTRAINT FK_project_milestones_phase FOREIGN KEY (phase_id) REFERENCES research.project_phases(phase_id),
    CONSTRAINT FK_project_milestones_owner FOREIGN KEY (owner_user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_milestones_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_milestones_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_project_milestones_status CHECK (milestone_status IN (N'not_started', N'in_progress', N'completed', N'at_risk', N'overdue', N'on_hold', N'cancelled')),
    CONSTRAINT CK_project_milestones_priority CHECK (priority_level IN (N'low', N'normal', N'high', N'urgent'))
);
GO

CREATE TABLE research.project_deadlines (
    deadline_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_deadlines PRIMARY KEY,
    project_id          BIGINT NULL,
    phase_id            BIGINT NULL,
    milestone_id        BIGINT NULL,
    deadline_type       NVARCHAR(100) NOT NULL, -- project_end, phase_due, milestone_due, ethics_expiry, progress_report_due
    deadline_title      NVARCHAR(255) NOT NULL,
    deadline_description NVARCHAR(MAX) NULL,
    due_date            DATE NOT NULL,
    completed_at        DATETIME2(0) NULL,
    responsible_user_id BIGINT NULL,
    priority_level      NVARCHAR(50) NOT NULL CONSTRAINT DF_project_deadlines_priority DEFAULT N'normal',
    deadline_status     NVARCHAR(100) NOT NULL CONSTRAINT DF_project_deadlines_status DEFAULT N'open', -- open, completed, overdue, cancelled
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_project_deadlines_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2(0) NULL,
    deleted_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT FK_project_deadlines_project FOREIGN KEY (project_id) REFERENCES research.research_projects(project_id),
    CONSTRAINT FK_project_deadlines_phase FOREIGN KEY (phase_id) REFERENCES research.project_phases(phase_id),
    CONSTRAINT FK_project_deadlines_milestone FOREIGN KEY (milestone_id) REFERENCES research.project_milestones(milestone_id),
    CONSTRAINT FK_project_deadlines_responsible FOREIGN KEY (responsible_user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_deadlines_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_project_deadlines_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_project_deadlines_priority CHECK (priority_level IN (N'low', N'normal', N'high', N'urgent')),
    CONSTRAINT CK_project_deadlines_status CHECK (deadline_status IN (N'open', N'completed', N'overdue', N'cancelled'))
);
GO

CREATE TABLE research.project_documents (
    document_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_project_documents PRIMARY KEY,
    project_id          BIGINT NOT NULL,
    phase_id            BIGINT NULL,
    milestone_id        BIGINT NULL,
    document_type       NVARCHAR(100) NOT NULL, -- protocol, ethics, report, attachment
    document_title      NVARCHAR(255) NOT NULL,
    file_name           NVARCHAR(255) NULL,
    file_url            NVARCHAR(1000) NULL,
    file_size_bytes     BIGINT NULL,
    mime_type           NVARCHAR(255) NULL,
    version_label       NVARCHAR(50) NULL,
    uploaded_at         DATETIME2(0) NOT NULL CONSTRAINT DF_project_documents_uploaded_at DEFAULT SYSUTCDATETIME(),
    uploaded_by         BIGINT NULL,
    is_active           BIT NOT NULL CONSTRAINT DF_project_documents_is_active DEFAULT (1),
    CONSTRAINT FK_project_documents_project FOREIGN KEY (project_id) REFERENCES research.research_projects(project_id),
    CONSTRAINT FK_project_documents_phase FOREIGN KEY (phase_id) REFERENCES research.project_phases(phase_id),
    CONSTRAINT FK_project_documents_milestone FOREIGN KEY (milestone_id) REFERENCES research.project_milestones(milestone_id),
    CONSTRAINT FK_project_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES auth.users(user_id)
);
GO

/* =========================================================
   5. TRAINING / CONFERENCE EVENTS
   ========================================================= */
CREATE TABLE training.event_categories (
    category_id     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_event_categories PRIMARY KEY,
    category_code   NVARCHAR(100) NOT NULL,
    category_name   NVARCHAR(255) NOT NULL,
    description     NVARCHAR(1000) NULL,
    color_class     NVARCHAR(100) NULL,
    sort_order      INT NOT NULL CONSTRAINT DF_event_categories_sort_order DEFAULT (0),
    is_active       BIT NOT NULL CONSTRAINT DF_event_categories_is_active DEFAULT (1),
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_event_categories_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_event_categories_code UNIQUE (category_code)
);
GO

CREATE TABLE training.training_events (
    event_id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_training_events PRIMARY KEY,
    event_code          NVARCHAR(100) NOT NULL,
    event_title         NVARCHAR(500) NOT NULL,
    event_description   NVARCHAR(MAX) NULL,
    event_year          INT NOT NULL,
    event_month         INT NOT NULL,
    planned_date        DATE NULL,
    start_time          TIME(0) NULL,
    end_time            TIME(0) NULL,
    actual_date         DATE NULL,
    category_id         BIGINT NULL,
    event_type          NVARCHAR(100) NOT NULL, -- conference, workshop, class, training, scientific_meeting, other
    plan_type           NVARCHAR(100) NOT NULL, -- planned, additional
    department_id       BIGINT NULL,
    responsible_user_id BIGINT NULL,
    location            NVARCHAR(500) NULL,
    delivery_mode       NVARCHAR(100) NOT NULL CONSTRAINT DF_training_events_delivery DEFAULT N'offline', -- offline, online, hybrid
    planned_attendees   INT NULL,
    actual_attendees    INT NULL,
    event_status        NVARCHAR(100) NOT NULL CONSTRAINT DF_training_events_status DEFAULT N'planned',
    cancellation_reason NVARCHAR(MAX) NULL,
    notes               NVARCHAR(MAX) NULL,
    is_active           BIT NOT NULL CONSTRAINT DF_training_events_is_active DEFAULT (1),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_training_events_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2(0) NULL,
    deleted_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT UQ_training_events_code UNIQUE (event_code),
    CONSTRAINT FK_training_events_category FOREIGN KEY (category_id) REFERENCES training.event_categories(category_id),
    CONSTRAINT FK_training_events_department FOREIGN KEY (department_id) REFERENCES ref.departments(department_id),
    CONSTRAINT FK_training_events_responsible FOREIGN KEY (responsible_user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_training_events_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_training_events_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_training_events_year CHECK (event_year BETWEEN 2000 AND 2100),
    CONSTRAINT CK_training_events_month CHECK (event_month BETWEEN 1 AND 12),
    CONSTRAINT CK_training_events_attendees CHECK ((planned_attendees IS NULL OR planned_attendees >= 0) AND (actual_attendees IS NULL OR actual_attendees >= 0)),
    CONSTRAINT CK_training_events_type CHECK (event_type IN (N'conference', N'workshop', N'class', N'training', N'scientific_meeting', N'other')),
    CONSTRAINT CK_training_events_plan_type CHECK (plan_type IN (N'planned', N'additional')),
    CONSTRAINT CK_training_events_delivery CHECK (delivery_mode IN (N'offline', N'online', N'hybrid')),
    CONSTRAINT CK_training_events_status CHECK (event_status IN (N'planned', N'preparing', N'completed', N'not_completed', N'postponed', N'cancelled'))
);
GO

CREATE TABLE training.training_event_participants (
    participant_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_training_event_participants PRIMARY KEY,
    event_id            BIGINT NOT NULL,
    user_id             BIGINT NULL,
    participant_name    NVARCHAR(255) NOT NULL,
    participant_email   NVARCHAR(255) NULL,
    department_id       BIGINT NULL,
    attendance_status   NVARCHAR(50) NOT NULL CONSTRAINT DF_training_event_participants_status DEFAULT N'registered', -- registered, attended, absent, cancelled
    checked_in_at       DATETIME2(0) NULL,
    notes               NVARCHAR(1000) NULL,
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_training_event_participants_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    CONSTRAINT FK_training_event_participants_event FOREIGN KEY (event_id) REFERENCES training.training_events(event_id),
    CONSTRAINT FK_training_event_participants_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_training_event_participants_department FOREIGN KEY (department_id) REFERENCES ref.departments(department_id),
    CONSTRAINT FK_training_event_participants_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_training_event_participants_status CHECK (attendance_status IN (N'registered', N'attended', N'absent', N'cancelled'))
);
GO

CREATE TABLE training.training_event_logs (
    event_log_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_training_event_logs PRIMARY KEY,
    event_id        BIGINT NOT NULL,
    action_type     NVARCHAR(100) NOT NULL, -- created, updated, completed, postponed, cancelled
    old_value_json  NVARCHAR(MAX) NULL,
    new_value_json  NVARCHAR(MAX) NULL,
    note            NVARCHAR(MAX) NULL,
    created_at      DATETIME2(0) NOT NULL CONSTRAINT DF_training_event_logs_created_at DEFAULT SYSUTCDATETIME(),
    created_by      BIGINT NULL,
    CONSTRAINT FK_training_event_logs_event FOREIGN KEY (event_id) REFERENCES training.training_events(event_id),
    CONSTRAINT FK_training_event_logs_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_training_event_logs_old_json CHECK (old_value_json IS NULL OR ISJSON(old_value_json) = 1),
    CONSTRAINT CK_training_event_logs_new_json CHECK (new_value_json IS NULL OR ISJSON(new_value_json) = 1)
);
GO

/* =========================================================
   6. NOTIFICATIONS / REMINDER RULES
   ========================================================= */
CREATE TABLE notify.notification_templates (
    template_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notification_templates PRIMARY KEY,
    template_code       NVARCHAR(100) NOT NULL,
    template_name       NVARCHAR(255) NOT NULL,
    notification_type   NVARCHAR(100) NOT NULL,
    title_template      NVARCHAR(500) NOT NULL,
    body_template       NVARCHAR(MAX) NOT NULL,
    email_subject_template NVARCHAR(500) NULL,
    email_body_template NVARCHAR(MAX) NULL,
    default_priority    NVARCHAR(50) NOT NULL CONSTRAINT DF_notification_templates_priority DEFAULT N'medium',
    is_active           BIT NOT NULL CONSTRAINT DF_notification_templates_is_active DEFAULT (1),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_notification_templates_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT UQ_notification_templates_code UNIQUE (template_code),
    CONSTRAINT FK_notification_templates_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_notification_templates_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_notification_templates_priority CHECK (default_priority IN (N'low', N'medium', N'high', N'urgent'))
);
GO

CREATE TABLE notify.notification_rules (
    rule_id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notification_rules PRIMARY KEY,
    rule_code           NVARCHAR(100) NOT NULL,
    rule_name           NVARCHAR(255) NOT NULL,
    object_type         NVARCHAR(100) NOT NULL, -- research_project, phase, milestone, training_event, ethics_approval, progress_report
    condition_type      NVARCHAR(100) NOT NULL, -- due_soon, overdue, upcoming, expiring_soon, no_progress_update
    reminder_days       INT NOT NULL CONSTRAINT DF_notification_rules_days DEFAULT (1),
    channel_in_app      BIT NOT NULL CONSTRAINT DF_notification_rules_in_app DEFAULT (1),
    channel_email       BIT NOT NULL CONSTRAINT DF_notification_rules_email DEFAULT (0),
    priority_level      NVARCHAR(50) NOT NULL CONSTRAINT DF_notification_rules_priority DEFAULT N'medium',
    template_id         BIGINT NULL,
    repeat_if_overdue   BIT NOT NULL CONSTRAINT DF_notification_rules_repeat DEFAULT (0),
    repeat_interval_days INT NULL,
    is_active           BIT NOT NULL CONSTRAINT DF_notification_rules_is_active DEFAULT (1),
    description         NVARCHAR(1000) NULL,
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_notification_rules_created_at DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2(0) NULL,
    deleted_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT UQ_notification_rules_code UNIQUE (rule_code),
    CONSTRAINT FK_notification_rules_template FOREIGN KEY (template_id) REFERENCES notify.notification_templates(template_id),
    CONSTRAINT FK_notification_rules_created_by FOREIGN KEY (created_by) REFERENCES auth.users(user_id),
    CONSTRAINT FK_notification_rules_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_notification_rules_object CHECK (object_type IN (N'research_project', N'phase', N'milestone', N'training_event', N'ethics_approval', N'progress_report')),
    CONSTRAINT CK_notification_rules_condition CHECK (condition_type IN (N'due_soon', N'overdue', N'upcoming', N'expiring_soon', N'no_progress_update')),
    CONSTRAINT CK_notification_rules_priority CHECK (priority_level IN (N'low', N'medium', N'high', N'urgent')),
    CONSTRAINT CK_notification_rules_days CHECK (reminder_days >= 0 AND reminder_days <= 365)
);
GO

CREATE TABLE notify.notifications (
    notification_id     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
    notification_type   NVARCHAR(100) NOT NULL,
    category            NVARCHAR(100) NOT NULL, -- deadline, training, research, ethics, system
    title               NVARCHAR(500) NOT NULL,
    message             NVARCHAR(MAX) NOT NULL,
    priority_level      NVARCHAR(50) NOT NULL CONSTRAINT DF_notifications_priority DEFAULT N'medium',
    related_entity_type NVARCHAR(100) NULL,
    related_entity_id   BIGINT NULL,
    related_entity_code NVARCHAR(100) NULL,
    action_url          NVARCHAR(1000) NULL,
    suggested_action    NVARCHAR(255) NULL,
    generated_by_rule_id BIGINT NULL,
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT SYSUTCDATETIME(),
    expires_at          DATETIME2(0) NULL,
    is_deleted          BIT NOT NULL CONSTRAINT DF_notifications_is_deleted DEFAULT (0),
    deleted_at          DATETIME2(0) NULL,
    CONSTRAINT FK_notifications_rule FOREIGN KEY (generated_by_rule_id) REFERENCES notify.notification_rules(rule_id),
    CONSTRAINT CK_notifications_priority CHECK (priority_level IN (N'low', N'medium', N'high', N'urgent')),
    CONSTRAINT CK_notifications_category CHECK (category IN (N'deadline', N'training', N'research', N'ethics', N'system'))
);
GO

CREATE TABLE notify.notification_recipients (
    notification_recipient_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notification_recipients PRIMARY KEY,
    notification_id     BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    is_read             BIT NOT NULL CONSTRAINT DF_notification_recipients_is_read DEFAULT (0),
    read_at             DATETIME2(0) NULL,
    is_dismissed        BIT NOT NULL CONSTRAINT DF_notification_recipients_is_dismissed DEFAULT (0),
    dismissed_at        DATETIME2(0) NULL,
    delivered_in_app_at DATETIME2(0) NULL,
    delivered_email_at  DATETIME2(0) NULL,
    email_send_status   NVARCHAR(50) NULL, -- pending, sent, failed
    email_failure_reason NVARCHAR(1000) NULL,
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_notification_recipients_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_notification_recipients_notification FOREIGN KEY (notification_id) REFERENCES notify.notifications(notification_id),
    CONSTRAINT FK_notification_recipients_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT UQ_notification_recipients UNIQUE (notification_id, user_id),
    CONSTRAINT CK_notification_recipients_email_status CHECK (email_send_status IS NULL OR email_send_status IN (N'pending', N'sent', N'failed'))
);
GO

CREATE TABLE notify.notification_settings (
    notification_setting_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notification_settings PRIMARY KEY,
    scope_type          NVARCHAR(50) NOT NULL, -- system, user
    user_id             BIGINT NULL,
    enable_system_notification BIT NOT NULL CONSTRAINT DF_notification_settings_enable_system DEFAULT (1),
    enable_email_notification BIT NOT NULL CONSTRAINT DF_notification_settings_enable_email DEFAULT (0),
    enable_in_app_notification BIT NOT NULL CONSTRAINT DF_notification_settings_enable_in_app DEFAULT (1),
    deadline_reminder_days_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_notification_settings_deadline DEFAULT N'[7,3,1,0]',
    training_event_reminder_days_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_notification_settings_training DEFAULT N'[7,3,1,0]',
    ethics_reminder_days_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_notification_settings_ethics DEFAULT N'[90,30,7]',
    project_end_reminder_days_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_notification_settings_project_end DEFAULT N'[30,14,7]',
    progress_report_reminder_days_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_notification_settings_progress DEFAULT N'[7,3,1]',
    daily_scan_time     TIME(0) NOT NULL CONSTRAINT DF_notification_settings_scan_time DEFAULT ('07:00'),
    repeat_if_overdue   BIT NOT NULL CONSTRAINT DF_notification_settings_repeat DEFAULT (1),
    overdue_repeat_days INT NOT NULL CONSTRAINT DF_notification_settings_repeat_days DEFAULT (1),
    auto_resolve_when_completed BIT NOT NULL CONSTRAINT DF_notification_settings_auto_resolve DEFAULT (1),
    created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_notification_settings_created_at DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(0) NULL,
    updated_by          BIGINT NULL,
    row_version         ROWVERSION NOT NULL,
    CONSTRAINT FK_notification_settings_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT FK_notification_settings_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(user_id),
    CONSTRAINT CK_notification_settings_scope CHECK (scope_type IN (N'system', N'user')),
    CONSTRAINT CK_notification_settings_deadline_json CHECK (ISJSON(deadline_reminder_days_json) = 1),
    CONSTRAINT CK_notification_settings_training_json CHECK (ISJSON(training_event_reminder_days_json) = 1),
    CONSTRAINT CK_notification_settings_ethics_json CHECK (ISJSON(ethics_reminder_days_json) = 1),
    CONSTRAINT CK_notification_settings_project_json CHECK (ISJSON(project_end_reminder_days_json) = 1),
    CONSTRAINT CK_notification_settings_progress_json CHECK (ISJSON(progress_report_reminder_days_json) = 1)
);
GO

/* =========================================================
   7. AUDIT / ACTIVITY LOGS
   ========================================================= */
CREATE TABLE audit.activity_logs (
    activity_log_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_activity_logs PRIMARY KEY,
    occurred_at     DATETIME2(0) NOT NULL CONSTRAINT DF_activity_logs_occurred_at DEFAULT SYSUTCDATETIME(),
    user_id         BIGINT NULL,
    module_code     NVARCHAR(100) NOT NULL,
    action_type     NVARCHAR(100) NOT NULL, -- create, update, delete, view, login, logout, export, configure
    entity_type     NVARCHAR(100) NULL,
    entity_id       BIGINT NULL,
    entity_code     NVARCHAR(100) NULL,
    action_summary  NVARCHAR(1000) NOT NULL,
    old_value_json  NVARCHAR(MAX) NULL,
    new_value_json  NVARCHAR(MAX) NULL,
    ip_address      NVARCHAR(100) NULL,
    user_agent      NVARCHAR(1000) NULL,
    request_id      NVARCHAR(100) NULL,
    status          NVARCHAR(50) NOT NULL CONSTRAINT DF_activity_logs_status DEFAULT N'success',
    error_message   NVARCHAR(MAX) NULL,
    CONSTRAINT FK_activity_logs_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT CK_activity_logs_status CHECK (status IN (N'success', N'failed', N'warning')),
    CONSTRAINT CK_activity_logs_old_json CHECK (old_value_json IS NULL OR ISJSON(old_value_json) = 1),
    CONSTRAINT CK_activity_logs_new_json CHECK (new_value_json IS NULL OR ISJSON(new_value_json) = 1)
);
GO

CREATE TABLE audit.data_change_logs (
    data_change_log_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_data_change_logs PRIMARY KEY,
    occurred_at     DATETIME2(0) NOT NULL CONSTRAINT DF_data_change_logs_occurred_at DEFAULT SYSUTCDATETIME(),
    user_id         BIGINT NULL,
    table_schema    NVARCHAR(128) NOT NULL,
    table_name      NVARCHAR(128) NOT NULL,
    primary_key_value NVARCHAR(255) NOT NULL,
    change_type     NVARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_value_json  NVARCHAR(MAX) NULL,
    new_value_json  NVARCHAR(MAX) NULL,
    request_id      NVARCHAR(100) NULL,
    CONSTRAINT FK_data_change_logs_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id),
    CONSTRAINT CK_data_change_logs_type CHECK (change_type IN (N'INSERT', N'UPDATE', N'DELETE')),
    CONSTRAINT CK_data_change_logs_old_json CHECK (old_value_json IS NULL OR ISJSON(old_value_json) = 1),
    CONSTRAINT CK_data_change_logs_new_json CHECK (new_value_json IS NULL OR ISJSON(new_value_json) = 1)
);
GO

/* =========================================================
   8. USEFUL VIEWS FOR UI
   ========================================================= */
CREATE VIEW research.v_research_project_overview
AS
SELECT
    p.project_id,
    p.project_code,
    p.project_title,
    d.department_name AS lead_department_name,
    pi.full_name AS principal_investigator_name,
    COALESCE(s.sponsor_name, p.sponsor_name_text) AS sponsor_name,
    p.protocol_number,
    p.protocol_version,
    p.ethics_status,
    p.ethics_expiry_date,
    p.planned_start_date,
    p.planned_end_date,
    p.progress_percent,
    p.current_phase_name,
    p.project_status,
    p.health_status,
    p.risk_level,
    nearest.next_due_date,
    nearest.next_due_title,
    CASE
        WHEN p.ethics_expiry_date IS NOT NULL AND p.ethics_expiry_date < CONVERT(DATE, GETDATE()) THEN 1
        ELSE 0
    END AS is_ethics_expired,
    CASE
        WHEN p.ethics_expiry_date IS NOT NULL AND p.ethics_expiry_date BETWEEN CONVERT(DATE, GETDATE()) AND DATEADD(DAY, 30, CONVERT(DATE, GETDATE())) THEN 1
        ELSE 0
    END AS is_ethics_expiring_soon
FROM research.research_projects p
LEFT JOIN ref.departments d ON p.lead_department_id = d.department_id
LEFT JOIN auth.users pi ON p.principal_investigator_id = pi.user_id
LEFT JOIN research.sponsors s ON p.sponsor_id = s.sponsor_id
OUTER APPLY (
    SELECT TOP 1
        dl.due_date AS next_due_date,
        dl.deadline_title AS next_due_title
    FROM research.project_deadlines dl
    WHERE dl.project_id = p.project_id
      AND dl.deleted_at IS NULL
      AND dl.deadline_status IN (N'open', N'overdue')
    ORDER BY dl.due_date ASC
) nearest
WHERE p.deleted_at IS NULL;
GO

CREATE VIEW training.v_training_monthly_summary
AS
SELECT
    event_year,
    event_month,
    SUM(CASE WHEN plan_type = N'planned' THEN 1 ELSE 0 END) AS planned_count,
    SUM(CASE WHEN plan_type = N'additional' THEN 1 ELSE 0 END) AS additional_count,
    SUM(CASE WHEN event_status = N'completed' THEN 1 ELSE 0 END) AS actual_count,
    SUM(CASE WHEN plan_type IN (N'planned', N'additional') THEN 1 ELSE 0 END) AS total_plan_count,
    CASE
        WHEN SUM(CASE WHEN plan_type IN (N'planned', N'additional') THEN 1 ELSE 0 END) - SUM(CASE WHEN event_status = N'completed' THEN 1 ELSE 0 END) < 0 THEN 0
        ELSE SUM(CASE WHEN plan_type IN (N'planned', N'additional') THEN 1 ELSE 0 END) - SUM(CASE WHEN event_status = N'completed' THEN 1 ELSE 0 END)
    END AS not_completed_count,
    CAST(
        CASE
            WHEN SUM(CASE WHEN plan_type IN (N'planned', N'additional') THEN 1 ELSE 0 END) = 0 THEN 0
            ELSE SUM(CASE WHEN event_status = N'completed' THEN 1.0 ELSE 0 END) / SUM(CASE WHEN plan_type IN (N'planned', N'additional') THEN 1.0 ELSE 0 END) * 100
        END AS DECIMAL(5,2)
    ) AS completion_rate
FROM training.training_events
WHERE deleted_at IS NULL
  AND is_active = 1
GROUP BY event_year, event_month;
GO

CREATE VIEW notify.v_user_notification_inbox
AS
SELECT
    nr.notification_recipient_id,
    n.notification_id,
    nr.user_id,
    n.notification_type,
    n.category,
    n.title,
    n.message,
    n.priority_level,
    n.related_entity_type,
    n.related_entity_id,
    n.related_entity_code,
    n.action_url,
    n.suggested_action,
    n.created_at,
    nr.is_read,
    nr.read_at,
    nr.is_dismissed,
    nr.dismissed_at
FROM notify.notifications n
INNER JOIN notify.notification_recipients nr ON n.notification_id = nr.notification_id
WHERE n.is_deleted = 0
  AND nr.is_dismissed = 0;
GO

/* =========================================================
   9. INDEXES
   ========================================================= */
CREATE INDEX IX_users_department_status ON auth.users(department_id, account_status) INCLUDE (full_name, email);
CREATE INDEX IX_user_roles_user_active ON auth.user_roles(user_id, is_active);
CREATE INDEX IX_role_permissions_role ON auth.role_permissions(role_id, permission_id);

CREATE INDEX IX_research_projects_status_year ON research.research_projects(project_status, planned_start_date, planned_end_date) INCLUDE (project_code, project_title, progress_percent);
CREATE INDEX IX_research_projects_department ON research.research_projects(lead_department_id, project_status);
CREATE INDEX IX_research_projects_ethics ON research.research_projects(ethics_status, ethics_expiry_date);
CREATE INDEX IX_project_phases_project_sort ON research.project_phases(project_id, sort_order, planned_start_date);
CREATE INDEX IX_project_phases_deadline ON research.project_phases(deadline_date, phase_status);
CREATE INDEX IX_project_milestones_due ON research.project_milestones(due_date, milestone_status, priority_level);
CREATE INDEX IX_project_deadlines_due ON research.project_deadlines(due_date, deadline_status, priority_level);
CREATE INDEX IX_project_deadlines_project ON research.project_deadlines(project_id, deadline_status);

CREATE INDEX IX_training_events_year_month ON training.training_events(event_year, event_month) INCLUDE (event_code, event_title, event_status, plan_type);
CREATE INDEX IX_training_events_date_status ON training.training_events(planned_date, event_status, plan_type);
CREATE INDEX IX_training_events_department ON training.training_events(department_id, event_year, event_month);

CREATE INDEX IX_notifications_created ON notify.notifications(created_at DESC, category, priority_level);
CREATE INDEX IX_notification_recipients_user_read ON notify.notification_recipients(user_id, is_read, created_at DESC);
CREATE INDEX IX_notification_rules_active ON notify.notification_rules(is_active, object_type, condition_type, reminder_days);

CREATE INDEX IX_activity_logs_occurred ON audit.activity_logs(occurred_at DESC);
CREATE INDEX IX_activity_logs_user ON audit.activity_logs(user_id, occurred_at DESC);
CREATE INDEX IX_activity_logs_module ON audit.activity_logs(module_code, action_type, occurred_at DESC);
CREATE INDEX IX_login_events_user_time ON audit.login_events(user_id, occurred_at DESC);
CREATE INDEX IX_login_events_time ON audit.login_events(occurred_at DESC, success);
GO

/* =========================================================
   10. SEED DATA - MINIMUM SYSTEM VALUES
   ========================================================= */
INSERT INTO ref.lookup_groups (group_code, group_name, description, is_active)
SELECT v.group_code, v.group_name, v.description, 1
FROM (VALUES
    (N'project_status', N'Trạng thái đề tài', N'Danh mục trạng thái đề tài nghiên cứu'),
    (N'phase_status', N'Trạng thái giai đoạn', N'Danh mục trạng thái giai đoạn'),
    (N'ethics_status', N'Trạng thái Ethics Approval', N'Danh mục trạng thái phê duyệt đạo đức'),
    (N'training_event_status', N'Trạng thái sự kiện đào tạo', N'Danh mục trạng thái sự kiện đào tạo'),
    (N'priority_level', N'Mức độ ưu tiên', N'Danh mục mức độ ưu tiên')
) v(group_code, group_name, description)
WHERE NOT EXISTS (SELECT 1 FROM ref.lookup_groups g WHERE g.group_code = v.group_code);
GO

INSERT INTO ref.departments (department_code, department_name, department_type, sort_order)
SELECT v.department_code, v.department_name, v.department_type, v.sort_order
FROM (VALUES
    (N'RMO', N'Phòng Quản lý Nghiên cứu Khoa học', N'Phòng', 1),
    (N'TRAINING', N'Phòng Đào tạo', N'Phòng', 2),
    (N'ENDO', N'Khoa Nội tiết', N'Khoa', 3),
    (N'CARD', N'Khoa Tim mạch', N'Khoa', 4),
    (N'ICU', N'Khoa Hồi sức tích cực', N'Khoa', 5),
    (N'IMG', N'Khoa Chẩn đoán hình ảnh', N'Khoa', 6),
    (N'PHARM', N'Khoa Dược', N'Khoa', 7),
    (N'LAB', N'Khoa Xét nghiệm', N'Khoa', 8),
    (N'IPC', N'Khoa Kiểm soát nhiễm khuẩn', N'Khoa', 9)
) v(department_code, department_name, department_type, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM ref.departments d WHERE d.department_code = v.department_code);
GO

INSERT INTO auth.roles (role_code, role_name, description, is_system, is_active)
SELECT v.role_code, v.role_name, v.description, v.is_system, 1
FROM (VALUES
    (N'ADMIN', N'Quản trị viên', N'Toàn quyền hệ thống', 1),
    (N'RESEARCH_OFFICE', N'Phòng Quản lý Nghiên cứu', N'Quản lý đề tài nghiên cứu', 1),
    (N'TRAINING_OFFICE', N'Phòng Đào tạo', N'Quản lý sự kiện đào tạo', 1),
    (N'PI', N'Chủ nhiệm đề tài', N'Quản lý đề tài được phân công', 1),
    (N'RESEARCH_MEMBER', N'Thành viên nghiên cứu', N'Tham gia đề tài nghiên cứu', 1),
    (N'VIEWER', N'Người xem', N'Chỉ xem dữ liệu được cấp quyền', 1)
) v(role_code, role_name, description, is_system)
WHERE NOT EXISTS (SELECT 1 FROM auth.roles r WHERE r.role_code = v.role_code);
GO

INSERT INTO auth.permissions (module_code, module_name, action_code, action_name, description)
SELECT v.module_code, v.module_name, v.action_code, v.action_name, v.description
FROM (
    SELECT m.module_code, m.module_name, a.action_code, a.action_name,
           CONCAT(m.module_name, N' - ', a.action_name) AS description
    FROM (VALUES
        (N'dashboard', N'Tổng quan tiến độ'),
        (N'research_project', N'Đề tài nghiên cứu'),
        (N'project_phase', N'Giai đoạn'),
        (N'project_milestone', N'Mốc tiến độ'),
        (N'deadline', N'Hạn chót'),
        (N'training_event', N'Sự kiện đào tạo'),
        (N'notification', N'Thông báo'),
        (N'setting', N'Cài đặt'),
        (N'user', N'Người dùng'),
        (N'role', N'Vai trò')
    ) m(module_code, module_name)
    CROSS JOIN (VALUES
        (N'view', N'Xem'),
        (N'create', N'Thêm'),
        (N'update', N'Sửa'),
        (N'delete', N'Xóa'),
        (N'approve', N'Duyệt'),
        (N'export', N'Xuất dữ liệu'),
        (N'configure', N'Cấu hình')
    ) a(action_code, action_name)
) v
WHERE NOT EXISTS (
    SELECT 1 FROM auth.permissions p
    WHERE p.module_code = v.module_code AND p.action_code = v.action_code
);
GO

INSERT INTO training.event_categories (category_code, category_name, color_class, sort_order)
SELECT v.category_code, v.category_name, v.color_class, v.sort_order
FROM (VALUES
    (N'conference', N'Hội nghị', N'blue', 1),
    (N'workshop', N'Hội thảo', N'purple', 2),
    (N'class', N'Lớp đào tạo', N'green', 3),
    (N'training', N'Tập huấn', N'orange', 4),
    (N'scientific_meeting', N'Sinh hoạt khoa học', N'cyan', 5),
    (N'other', N'Khác', N'slate', 6)
) v(category_code, category_name, color_class, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM training.event_categories c WHERE c.category_code = v.category_code);
GO

INSERT INTO notify.notification_settings (scope_type)
SELECT N'system'
WHERE NOT EXISTS (SELECT 1 FROM notify.notification_settings WHERE scope_type = N'system' AND user_id IS NULL);
GO

/* =========================================================
   11. OPTIONAL SYSTEM PROCEDURE HELPERS
   ========================================================= */
CREATE OR ALTER PROCEDURE audit.p_write_activity_log
    @user_id BIGINT = NULL,
    @module_code NVARCHAR(100),
    @action_type NVARCHAR(100),
    @entity_type NVARCHAR(100) = NULL,
    @entity_id BIGINT = NULL,
    @entity_code NVARCHAR(100) = NULL,
    @action_summary NVARCHAR(1000),
    @old_value_json NVARCHAR(MAX) = NULL,
    @new_value_json NVARCHAR(MAX) = NULL,
    @ip_address NVARCHAR(100) = NULL,
    @user_agent NVARCHAR(1000) = NULL,
    @request_id NVARCHAR(100) = NULL,
    @status NVARCHAR(50) = N'success',
    @error_message NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO audit.activity_logs (
        user_id, module_code, action_type, entity_type, entity_id, entity_code,
        action_summary, old_value_json, new_value_json, ip_address, user_agent,
        request_id, status, error_message
    )
    VALUES (
        @user_id, @module_code, @action_type, @entity_type, @entity_id, @entity_code,
        @action_summary, @old_value_json, @new_value_json, @ip_address, @user_agent,
        @request_id, @status, @error_message
    );
END;
GO

CREATE OR ALTER PROCEDURE notify.p_mark_notification_read
    @notification_id BIGINT,
    @user_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE notify.notification_recipients
    SET is_read = 1,
        read_at = COALESCE(read_at, SYSUTCDATETIME())
    WHERE notification_id = @notification_id
      AND user_id = @user_id;
END;
GO

CREATE OR ALTER PROCEDURE notify.p_mark_all_notifications_read
    @user_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE notify.notification_recipients
    SET is_read = 1,
        read_at = COALESCE(read_at, SYSUTCDATETIME())
    WHERE user_id = @user_id
      AND is_read = 0;
END;
GO

CREATE OR ALTER PROCEDURE notify.p_create_notification
    @notification_type NVARCHAR(100),
    @category NVARCHAR(100),
    @title NVARCHAR(500),
    @message NVARCHAR(MAX),
    @priority_level NVARCHAR(50),
    @related_entity_type NVARCHAR(100) = NULL,
    @related_entity_id BIGINT = NULL,
    @related_entity_code NVARCHAR(100) = NULL,
    @recipient_user_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @notification_id BIGINT;

    INSERT INTO notify.notifications (
        notification_type, category, title, message, priority_level,
        related_entity_type, related_entity_id, related_entity_code
    )
    VALUES (
        @notification_type, @category, @title, @message, @priority_level,
        @related_entity_type, @related_entity_id, @related_entity_code
    );

    SET @notification_id = SCOPE_IDENTITY();

    INSERT INTO notify.notification_recipients (notification_id, user_id, delivered_in_app_at)
    VALUES (@notification_id, @recipient_user_id, SYSUTCDATETIME());

    SELECT @notification_id AS notification_id;
END;
GO

/* =========================================================
   END OF RMS SQL SERVER DDL
   ========================================================= */
