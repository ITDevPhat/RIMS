using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Rms.Infrastructure.Persistence.Migrations.PostgreSql
{
    /// <inheritdoc />
    public partial class InitialPostgreSql : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "audit");

            migrationBuilder.EnsureSchema(
                name: "ref");

            migrationBuilder.EnsureSchema(
                name: "training");

            migrationBuilder.EnsureSchema(
                name: "auth");

            migrationBuilder.EnsureSchema(
                name: "notify");

            migrationBuilder.EnsureSchema(
                name: "research");

            migrationBuilder.CreateTable(
                name: "departments",
                schema: "ref",
                columns: table => new
                {
                    department_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    department_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    department_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    parent_department_id = table.Column<long>(type: "bigint", nullable: true),
                    department_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_departments", x => x.department_id);
                    table.ForeignKey(
                        name: "FK_departments_parent",
                        column: x => x.parent_department_id,
                        principalSchema: "ref",
                        principalTable: "departments",
                        principalColumn: "department_id");
                });

            migrationBuilder.CreateTable(
                name: "event_categories",
                schema: "training",
                columns: table => new
                {
                    category_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    color_class = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_categories", x => x.category_id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                schema: "auth",
                columns: table => new
                {
                    permission_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    module_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    module_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    action_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    action_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    permission_code = table.Column<string>(type: "character varying(201)", maxLength: 201, nullable: true, computedColumnSql: "module_code || '.' || action_code", stored: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.permission_id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                schema: "auth",
                columns: table => new
                {
                    role_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    role_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.role_id);
                });

            migrationBuilder.CreateTable(
                name: "system_settings",
                schema: "ref",
                columns: table => new
                {
                    setting_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    setting_key = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    setting_value = table.Column<string>(type: "text", nullable: true),
                    value_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "string"),
                    setting_group = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "general"),
                    setting_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_settings", x => x.setting_id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "auth",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    password_salt = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    full_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    initials = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    department_id = table.Column<long>(type: "bigint", nullable: true),
                    account_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "active"),
                    is_system_admin = table.Column<bool>(type: "boolean", nullable: false),
                    email_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false),
                    failed_login_count = table.Column<int>(type: "integer", nullable: false),
                    locked_until = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    last_login_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    last_login_ip = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    password_changed_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_users_department",
                        column: x => x.department_id,
                        principalSchema: "ref",
                        principalTable: "departments",
                        principalColumn: "department_id");
                });

            migrationBuilder.CreateTable(
                name: "activity_logs",
                schema: "audit",
                columns: table => new
                {
                    activity_log_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    occurred_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    module_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    action_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    entity_id = table.Column<long>(type: "bigint", nullable: true),
                    entity_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    action_summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    old_value_json = table.Column<string>(type: "jsonb", nullable: true),
                    new_value_json = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    request_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "success"),
                    error_message = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_activity_logs", x => x.activity_log_id);
                    table.ForeignKey(
                        name: "FK_activity_logs_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "data_change_logs",
                schema: "audit",
                columns: table => new
                {
                    data_change_log_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    occurred_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    table_schema = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    table_name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    primary_key_value = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    change_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    old_value_json = table.Column<string>(type: "jsonb", nullable: true),
                    new_value_json = table.Column<string>(type: "jsonb", nullable: true),
                    request_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_change_logs", x => x.data_change_log_id);
                    table.ForeignKey(
                        name: "FK_data_change_logs_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "login_events",
                schema: "audit",
                columns: table => new
                {
                    login_event_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    username_or_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    success = table.Column<bool>(type: "boolean", nullable: false),
                    ip_address = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    failure_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    occurred_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_login_events", x => x.login_event_id);
                    table.ForeignKey(
                        name: "FK_login_events_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "login_sessions",
                schema: "auth",
                columns: table => new
                {
                    session_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    session_token_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ip_address = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    device_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    login_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    expires_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    logout_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    logout_reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_login_sessions", x => x.session_id);
                    table.ForeignKey(
                        name: "FK_login_sessions_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "notification_settings",
                schema: "notify",
                columns: table => new
                {
                    notification_setting_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    scope_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    enable_system_notification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    enable_email_notification = table.Column<bool>(type: "boolean", nullable: false),
                    enable_in_app_notification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    deadline_reminder_days_json = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "[7,3,1,0]"),
                    training_event_reminder_days_json = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "[7,3,1,0]"),
                    ethics_reminder_days_json = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "[90,30,7]"),
                    project_end_reminder_days_json = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "[30,14,7]"),
                    progress_report_reminder_days_json = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "[7,3,1]"),
                    daily_scan_time = table.Column<TimeOnly>(type: "time(0) without time zone", precision: 0, nullable: false, defaultValue: new TimeOnly(7, 0, 0)),
                    repeat_if_overdue = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    overdue_repeat_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    auto_resolve_when_completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_settings", x => x.notification_setting_id);
                    table.ForeignKey(
                        name: "FK_notification_settings_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_notification_settings_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "notification_templates",
                schema: "notify",
                columns: table => new
                {
                    template_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    template_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    template_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    notification_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title_template = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    body_template = table.Column<string>(type: "text", nullable: false),
                    email_subject_template = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    email_body_template = table.Column<string>(type: "text", nullable: true),
                    default_priority = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "medium"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_templates", x => x.template_id);
                    table.ForeignKey(
                        name: "FK_notification_templates_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_notification_templates_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "password_reset_tokens",
                schema: "auth",
                columns: table => new
                {
                    token_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false),
                    used_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_tokens", x => x.token_id);
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_password_reset_tokens_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "auth",
                columns: table => new
                {
                    role_permission_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<long>(type: "bigint", nullable: false),
                    permission_id = table.Column<long>(type: "bigint", nullable: false),
                    is_allowed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    assigned_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    assigned_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.role_permission_id);
                    table.ForeignKey(
                        name: "FK_role_permissions_assigned_by",
                        column: x => x.assigned_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_role_permissions_permission",
                        column: x => x.permission_id,
                        principalSchema: "auth",
                        principalTable: "permissions",
                        principalColumn: "permission_id");
                    table.ForeignKey(
                        name: "FK_role_permissions_role",
                        column: x => x.role_id,
                        principalSchema: "auth",
                        principalTable: "roles",
                        principalColumn: "role_id");
                });

            migrationBuilder.CreateTable(
                name: "sponsors",
                schema: "research",
                columns: table => new
                {
                    sponsor_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sponsor_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sponsor_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    sponsor_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    contact_person = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    contact_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    address = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sponsors", x => x.sponsor_id);
                    table.ForeignKey(
                        name: "FK_sponsors_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_sponsors_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "training_events",
                schema: "training",
                columns: table => new
                {
                    event_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    event_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    event_title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    event_description = table.Column<string>(type: "text", nullable: true),
                    event_year = table.Column<int>(type: "integer", nullable: false),
                    event_month = table.Column<int>(type: "integer", nullable: false),
                    planned_date = table.Column<DateOnly>(type: "date", nullable: true),
                    start_time = table.Column<TimeOnly>(type: "time(0) without time zone", precision: 0, nullable: true),
                    end_time = table.Column<TimeOnly>(type: "time(0) without time zone", precision: 0, nullable: true),
                    actual_date = table.Column<DateOnly>(type: "date", nullable: true),
                    category_id = table.Column<long>(type: "bigint", nullable: true),
                    event_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    plan_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    department_id = table.Column<long>(type: "bigint", nullable: true),
                    responsible_user_id = table.Column<long>(type: "bigint", nullable: true),
                    location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    delivery_mode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "offline"),
                    planned_attendees = table.Column<int>(type: "integer", nullable: true),
                    actual_attendees = table.Column<int>(type: "integer", nullable: true),
                    event_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "planned"),
                    cancellation_reason = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_events", x => x.event_id);
                    table.ForeignKey(
                        name: "FK_training_events_category",
                        column: x => x.category_id,
                        principalSchema: "training",
                        principalTable: "event_categories",
                        principalColumn: "category_id");
                    table.ForeignKey(
                        name: "FK_training_events_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_training_events_department",
                        column: x => x.department_id,
                        principalSchema: "ref",
                        principalTable: "departments",
                        principalColumn: "department_id");
                    table.ForeignKey(
                        name: "FK_training_events_responsible",
                        column: x => x.responsible_user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_training_events_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                schema: "auth",
                columns: table => new
                {
                    preference_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    appearance_mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "system"),
                    language_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "vi-VN"),
                    enable_in_app_notification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    enable_email_notification = table.Column<bool>(type: "boolean", nullable: false),
                    receive_deadline_notification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    receive_training_notification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    receive_ethics_notification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    auto_mark_read_on_open = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preferences", x => x.preference_id);
                    table.ForeignKey(
                        name: "FK_user_preferences_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                schema: "auth",
                columns: table => new
                {
                    user_role_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    role_id = table.Column<long>(type: "bigint", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    assigned_by = table.Column<long>(type: "bigint", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => x.user_role_id);
                    table.ForeignKey(
                        name: "FK_user_roles_assigned_by",
                        column: x => x.assigned_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_user_roles_role",
                        column: x => x.role_id,
                        principalSchema: "auth",
                        principalTable: "roles",
                        principalColumn: "role_id");
                    table.ForeignKey(
                        name: "FK_user_roles_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "notification_rules",
                schema: "notify",
                columns: table => new
                {
                    rule_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    rule_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    rule_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    object_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    condition_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    reminder_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    channel_in_app = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    channel_email = table.Column<bool>(type: "boolean", nullable: false),
                    priority_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "medium"),
                    template_id = table.Column<long>(type: "bigint", nullable: true),
                    repeat_if_overdue = table.Column<bool>(type: "boolean", nullable: false),
                    repeat_interval_days = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_rules", x => x.rule_id);
                    table.ForeignKey(
                        name: "FK_notification_rules_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_notification_rules_template",
                        column: x => x.template_id,
                        principalSchema: "notify",
                        principalTable: "notification_templates",
                        principalColumn: "template_id");
                    table.ForeignKey(
                        name: "FK_notification_rules_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "research_projects",
                schema: "research",
                columns: table => new
                {
                    project_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    project_title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    project_description = table.Column<string>(type: "text", nullable: true),
                    lead_department_id = table.Column<long>(type: "bigint", nullable: true),
                    principal_investigator_id = table.Column<long>(type: "bigint", nullable: true),
                    sponsor_id = table.Column<long>(type: "bigint", nullable: true),
                    sponsor_name_text = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    research_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    protocol_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    protocol_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ethics_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "not_required"),
                    ethics_approval_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ethics_approval_date = table.Column<DateOnly>(type: "date", nullable: true),
                    ethics_expiry_date = table.Column<DateOnly>(type: "date", nullable: true),
                    planned_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    planned_end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    actual_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    actual_end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    current_phase_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    progress_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    project_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "not_started"),
                    health_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "on_track"),
                    risk_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "low"),
                    priority_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "normal"),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_research_projects", x => x.project_id);
                    table.ForeignKey(
                        name: "FK_research_projects_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_research_projects_department",
                        column: x => x.lead_department_id,
                        principalSchema: "ref",
                        principalTable: "departments",
                        principalColumn: "department_id");
                    table.ForeignKey(
                        name: "FK_research_projects_pi",
                        column: x => x.principal_investigator_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_research_projects_sponsor",
                        column: x => x.sponsor_id,
                        principalSchema: "research",
                        principalTable: "sponsors",
                        principalColumn: "sponsor_id");
                    table.ForeignKey(
                        name: "FK_research_projects_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "training_event_logs",
                schema: "training",
                columns: table => new
                {
                    event_log_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    event_id = table.Column<long>(type: "bigint", nullable: false),
                    action_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    old_value_json = table.Column<string>(type: "jsonb", nullable: true),
                    new_value_json = table.Column<string>(type: "jsonb", nullable: true),
                    note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_event_logs", x => x.event_log_id);
                    table.ForeignKey(
                        name: "FK_training_event_logs_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_training_event_logs_event",
                        column: x => x.event_id,
                        principalSchema: "training",
                        principalTable: "training_events",
                        principalColumn: "event_id");
                });

            migrationBuilder.CreateTable(
                name: "training_event_participants",
                schema: "training",
                columns: table => new
                {
                    participant_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    event_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    participant_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    participant_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    department_id = table.Column<long>(type: "bigint", nullable: true),
                    attendance_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "registered"),
                    checked_in_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_event_participants", x => x.participant_id);
                    table.ForeignKey(
                        name: "FK_training_event_participants_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_training_event_participants_department",
                        column: x => x.department_id,
                        principalSchema: "ref",
                        principalTable: "departments",
                        principalColumn: "department_id");
                    table.ForeignKey(
                        name: "FK_training_event_participants_event",
                        column: x => x.event_id,
                        principalSchema: "training",
                        principalTable: "training_events",
                        principalColumn: "event_id");
                    table.ForeignKey(
                        name: "FK_training_event_participants_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                schema: "notify",
                columns: table => new
                {
                    notification_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    notification_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    priority_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "medium"),
                    related_entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    related_entity_id = table.Column<long>(type: "bigint", nullable: true),
                    related_entity_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    action_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    suggested_action = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    generated_by_rule_id = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    expires_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.notification_id);
                    table.ForeignKey(
                        name: "FK_notifications_rule",
                        column: x => x.generated_by_rule_id,
                        principalSchema: "notify",
                        principalTable: "notification_rules",
                        principalColumn: "rule_id");
                });

            migrationBuilder.CreateTable(
                name: "project_members",
                schema: "research",
                columns: table => new
                {
                    project_member_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    member_role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    responsibility = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    joined_at = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE"),
                    left_at = table.Column<DateOnly>(type: "date", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_members", x => x.project_member_id);
                    table.ForeignKey(
                        name: "FK_project_members_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_members_project",
                        column: x => x.project_id,
                        principalSchema: "research",
                        principalTable: "research_projects",
                        principalColumn: "project_id");
                    table.ForeignKey(
                        name: "FK_project_members_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "project_phases",
                schema: "research",
                columns: table => new
                {
                    phase_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<long>(type: "bigint", nullable: false),
                    phase_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    phase_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    phase_description = table.Column<string>(type: "text", nullable: true),
                    owner_user_id = table.Column<long>(type: "bigint", nullable: true),
                    planned_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    planned_end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    deadline_date = table.Column<DateOnly>(type: "date", nullable: true),
                    actual_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    actual_end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    progress_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    phase_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "not_started"),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_phases", x => x.phase_id);
                    table.ForeignKey(
                        name: "FK_project_phases_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_phases_owner",
                        column: x => x.owner_user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_phases_project",
                        column: x => x.project_id,
                        principalSchema: "research",
                        principalTable: "research_projects",
                        principalColumn: "project_id");
                    table.ForeignKey(
                        name: "FK_project_phases_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "notification_recipients",
                schema: "notify",
                columns: table => new
                {
                    notification_recipient_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    notification_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    read_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    is_dismissed = table.Column<bool>(type: "boolean", nullable: false),
                    dismissed_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    delivered_in_app_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    delivered_email_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    email_send_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    email_failure_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_recipients", x => x.notification_recipient_id);
                    table.ForeignKey(
                        name: "FK_notification_recipients_notification",
                        column: x => x.notification_id,
                        principalSchema: "notify",
                        principalTable: "notifications",
                        principalColumn: "notification_id");
                    table.ForeignKey(
                        name: "FK_notification_recipients_user",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "project_milestones",
                schema: "research",
                columns: table => new
                {
                    milestone_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<long>(type: "bigint", nullable: false),
                    phase_id = table.Column<long>(type: "bigint", nullable: true),
                    milestone_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    milestone_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    milestone_description = table.Column<string>(type: "text", nullable: true),
                    due_date = table.Column<DateOnly>(type: "date", nullable: false),
                    completed_date = table.Column<DateOnly>(type: "date", nullable: true),
                    owner_user_id = table.Column<long>(type: "bigint", nullable: true),
                    milestone_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "not_started"),
                    priority_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "normal"),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_milestones", x => x.milestone_id);
                    table.ForeignKey(
                        name: "FK_project_milestones_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_milestones_owner",
                        column: x => x.owner_user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_milestones_phase",
                        column: x => x.phase_id,
                        principalSchema: "research",
                        principalTable: "project_phases",
                        principalColumn: "phase_id");
                    table.ForeignKey(
                        name: "FK_project_milestones_project",
                        column: x => x.project_id,
                        principalSchema: "research",
                        principalTable: "research_projects",
                        principalColumn: "project_id");
                    table.ForeignKey(
                        name: "FK_project_milestones_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "project_deadlines",
                schema: "research",
                columns: table => new
                {
                    deadline_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<long>(type: "bigint", nullable: true),
                    phase_id = table.Column<long>(type: "bigint", nullable: true),
                    milestone_id = table.Column<long>(type: "bigint", nullable: true),
                    deadline_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    deadline_title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    deadline_description = table.Column<string>(type: "text", nullable: true),
                    due_date = table.Column<DateOnly>(type: "date", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    responsible_user_id = table.Column<long>(type: "bigint", nullable: true),
                    priority_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "normal"),
                    deadline_status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "open"),
                    created_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: true),
                    deleted_by = table.Column<long>(type: "bigint", nullable: true),
                    row_version = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_deadlines", x => x.deadline_id);
                    table.ForeignKey(
                        name: "FK_project_deadlines_created_by",
                        column: x => x.created_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_deadlines_milestone",
                        column: x => x.milestone_id,
                        principalSchema: "research",
                        principalTable: "project_milestones",
                        principalColumn: "milestone_id");
                    table.ForeignKey(
                        name: "FK_project_deadlines_phase",
                        column: x => x.phase_id,
                        principalSchema: "research",
                        principalTable: "project_phases",
                        principalColumn: "phase_id");
                    table.ForeignKey(
                        name: "FK_project_deadlines_project",
                        column: x => x.project_id,
                        principalSchema: "research",
                        principalTable: "research_projects",
                        principalColumn: "project_id");
                    table.ForeignKey(
                        name: "FK_project_deadlines_responsible",
                        column: x => x.responsible_user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "FK_project_deadlines_updated_by",
                        column: x => x.updated_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateTable(
                name: "project_documents",
                schema: "research",
                columns: table => new
                {
                    document_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<long>(type: "bigint", nullable: false),
                    phase_id = table.Column<long>(type: "bigint", nullable: true),
                    milestone_id = table.Column<long>(type: "bigint", nullable: true),
                    document_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    document_title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    file_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: true),
                    mime_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    version_label = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    uploaded_at = table.Column<DateTime>(type: "timestamp(0) with time zone", precision: 0, nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    uploaded_by = table.Column<long>(type: "bigint", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_documents", x => x.document_id);
                    table.ForeignKey(
                        name: "FK_project_documents_milestone",
                        column: x => x.milestone_id,
                        principalSchema: "research",
                        principalTable: "project_milestones",
                        principalColumn: "milestone_id");
                    table.ForeignKey(
                        name: "FK_project_documents_phase",
                        column: x => x.phase_id,
                        principalSchema: "research",
                        principalTable: "project_phases",
                        principalColumn: "phase_id");
                    table.ForeignKey(
                        name: "FK_project_documents_project",
                        column: x => x.project_id,
                        principalSchema: "research",
                        principalTable: "research_projects",
                        principalColumn: "project_id");
                    table.ForeignKey(
                        name: "FK_project_documents_uploaded_by",
                        column: x => x.uploaded_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "user_id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_module",
                schema: "audit",
                table: "activity_logs",
                columns: new[] { "module_code", "action_type", "occurred_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_occurred",
                schema: "audit",
                table: "activity_logs",
                column: "occurred_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_activity_logs_user",
                schema: "audit",
                table: "activity_logs",
                columns: new[] { "user_id", "occurred_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_data_change_logs_user_id",
                schema: "audit",
                table: "data_change_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_departments_parent_department_id",
                schema: "ref",
                table: "departments",
                column: "parent_department_id");

            migrationBuilder.CreateIndex(
                name: "UQ_departments_code",
                schema: "ref",
                table: "departments",
                column: "department_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_event_categories_code",
                schema: "training",
                table: "event_categories",
                column: "category_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_login_events_time",
                schema: "audit",
                table: "login_events",
                columns: new[] { "occurred_at", "success" },
                descending: new[] { true, false });

            migrationBuilder.CreateIndex(
                name: "IX_login_events_user_time",
                schema: "audit",
                table: "login_events",
                columns: new[] { "user_id", "occurred_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_login_sessions_user_id",
                schema: "auth",
                table: "login_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_notification_recipients_user_read",
                schema: "notify",
                table: "notification_recipients",
                columns: new[] { "user_id", "is_read", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "UQ_notification_recipients",
                schema: "notify",
                table: "notification_recipients",
                columns: new[] { "notification_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_rules_active",
                schema: "notify",
                table: "notification_rules",
                columns: new[] { "is_active", "object_type", "condition_type", "reminder_days" });

            migrationBuilder.CreateIndex(
                name: "IX_notification_rules_created_by",
                schema: "notify",
                table: "notification_rules",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_notification_rules_template_id",
                schema: "notify",
                table: "notification_rules",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "IX_notification_rules_updated_by",
                schema: "notify",
                table: "notification_rules",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "UQ_notification_rules_code",
                schema: "notify",
                table: "notification_rules",
                column: "rule_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notification_settings_updated_by",
                schema: "notify",
                table: "notification_settings",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_notification_settings_user_id",
                schema: "notify",
                table: "notification_settings",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_notification_templates_created_by",
                schema: "notify",
                table: "notification_templates",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_notification_templates_updated_by",
                schema: "notify",
                table: "notification_templates",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "UQ_notification_templates_code",
                schema: "notify",
                table: "notification_templates",
                column: "template_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_created",
                schema: "notify",
                table: "notifications",
                columns: new[] { "created_at", "category", "priority_level" },
                descending: new[] { true, false, false });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_generated_by_rule_id",
                schema: "notify",
                table: "notifications",
                column: "generated_by_rule_id");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_created_by",
                schema: "auth",
                table: "password_reset_tokens",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_tokens_user_id",
                schema: "auth",
                table: "password_reset_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "UQ_permissions_code",
                schema: "auth",
                table: "permissions",
                column: "permission_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_permissions_module_action",
                schema: "auth",
                table: "permissions",
                columns: new[] { "module_code", "action_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_created_by",
                schema: "research",
                table: "project_deadlines",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_due",
                schema: "research",
                table: "project_deadlines",
                columns: new[] { "due_date", "deadline_status", "priority_level" });

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_milestone_id",
                schema: "research",
                table: "project_deadlines",
                column: "milestone_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_phase_id",
                schema: "research",
                table: "project_deadlines",
                column: "phase_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_project",
                schema: "research",
                table: "project_deadlines",
                columns: new[] { "project_id", "deadline_status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_responsible_user_id",
                schema: "research",
                table: "project_deadlines",
                column: "responsible_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_deadlines_updated_by",
                schema: "research",
                table: "project_deadlines",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_documents_milestone_id",
                schema: "research",
                table: "project_documents",
                column: "milestone_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_documents_phase_id",
                schema: "research",
                table: "project_documents",
                column: "phase_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_documents_project_id",
                schema: "research",
                table: "project_documents",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_documents_uploaded_by",
                schema: "research",
                table: "project_documents",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_members_created_by",
                schema: "research",
                table: "project_members",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_members_user_id",
                schema: "research",
                table: "project_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "UQ_project_members_project_user_role",
                schema: "research",
                table: "project_members",
                columns: new[] { "project_id", "user_id", "member_role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_created_by",
                schema: "research",
                table: "project_milestones",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_due",
                schema: "research",
                table: "project_milestones",
                columns: new[] { "due_date", "milestone_status", "priority_level" });

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_owner_user_id",
                schema: "research",
                table: "project_milestones",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_phase_id",
                schema: "research",
                table: "project_milestones",
                column: "phase_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_project_id",
                schema: "research",
                table: "project_milestones",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_updated_by",
                schema: "research",
                table: "project_milestones",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_phases_created_by",
                schema: "research",
                table: "project_phases",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_project_phases_deadline",
                schema: "research",
                table: "project_phases",
                columns: new[] { "deadline_date", "phase_status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_phases_owner_user_id",
                schema: "research",
                table: "project_phases",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_phases_project_sort",
                schema: "research",
                table: "project_phases",
                columns: new[] { "project_id", "sort_order", "planned_start_date" });

            migrationBuilder.CreateIndex(
                name: "IX_project_phases_updated_by",
                schema: "research",
                table: "project_phases",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_created_by",
                schema: "research",
                table: "research_projects",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_department",
                schema: "research",
                table: "research_projects",
                columns: new[] { "lead_department_id", "project_status" });

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_ethics",
                schema: "research",
                table: "research_projects",
                columns: new[] { "ethics_status", "ethics_expiry_date" });

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_principal_investigator_id",
                schema: "research",
                table: "research_projects",
                column: "principal_investigator_id");

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_sponsor_id",
                schema: "research",
                table: "research_projects",
                column: "sponsor_id");

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_status_year",
                schema: "research",
                table: "research_projects",
                columns: new[] { "project_status", "planned_start_date", "planned_end_date" });

            migrationBuilder.CreateIndex(
                name: "IX_research_projects_updated_by",
                schema: "research",
                table: "research_projects",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "UQ_research_projects_code",
                schema: "research",
                table: "research_projects",
                column: "project_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_assigned_by",
                schema: "auth",
                table: "role_permissions",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_permission_id",
                schema: "auth",
                table: "role_permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_role",
                schema: "auth",
                table: "role_permissions",
                columns: new[] { "role_id", "permission_id" });

            migrationBuilder.CreateIndex(
                name: "UQ_role_permissions_role_permission",
                schema: "auth",
                table: "role_permissions",
                columns: new[] { "role_id", "permission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_roles_code",
                schema: "auth",
                table: "roles",
                column: "role_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sponsors_created_by",
                schema: "research",
                table: "sponsors",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_sponsors_updated_by",
                schema: "research",
                table: "sponsors",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "UQ_sponsors_code",
                schema: "research",
                table: "sponsors",
                column: "sponsor_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_system_settings_key",
                schema: "ref",
                table: "system_settings",
                column: "setting_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_training_event_logs_created_by",
                schema: "training",
                table: "training_event_logs",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_training_event_logs_event_id",
                schema: "training",
                table: "training_event_logs",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_event_participants_created_by",
                schema: "training",
                table: "training_event_participants",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_training_event_participants_department_id",
                schema: "training",
                table: "training_event_participants",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_event_participants_event_id",
                schema: "training",
                table: "training_event_participants",
                column: "event_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_event_participants_user_id",
                schema: "training",
                table: "training_event_participants",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_events_category_id",
                schema: "training",
                table: "training_events",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_events_created_by",
                schema: "training",
                table: "training_events",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "IX_training_events_date_status",
                schema: "training",
                table: "training_events",
                columns: new[] { "planned_date", "event_status", "plan_type" });

            migrationBuilder.CreateIndex(
                name: "IX_training_events_department",
                schema: "training",
                table: "training_events",
                columns: new[] { "department_id", "event_year", "event_month" });

            migrationBuilder.CreateIndex(
                name: "IX_training_events_responsible_user_id",
                schema: "training",
                table: "training_events",
                column: "responsible_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_events_updated_by",
                schema: "training",
                table: "training_events",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "IX_training_events_year_month",
                schema: "training",
                table: "training_events",
                columns: new[] { "event_year", "event_month" });

            migrationBuilder.CreateIndex(
                name: "UQ_training_events_code",
                schema: "training",
                table: "training_events",
                column: "event_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_user_preferences_user",
                schema: "auth",
                table: "user_preferences",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_assigned_by",
                schema: "auth",
                table: "user_roles",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_role_id",
                schema: "auth",
                table: "user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_user_active",
                schema: "auth",
                table: "user_roles",
                columns: new[] { "user_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "UQ_user_roles_user_role",
                schema: "auth",
                table: "user_roles",
                columns: new[] { "user_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_department_status",
                schema: "auth",
                table: "users",
                columns: new[] { "department_id", "account_status" });

            migrationBuilder.CreateIndex(
                name: "UQ_users_email",
                schema: "auth",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_users_username",
                schema: "auth",
                table: "users",
                column: "username",
                unique: true);

            migrationBuilder.Sql("""
                CREATE OR REPLACE VIEW research.v_research_project_overview AS
                SELECT
                    p.project_id,
                    p.project_code,
                    p.project_title,
                    d.department_name AS lead_department_name,
                    u.full_name AS principal_investigator_name,
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
                    nd.due_date AS next_due_date,
                    nd.deadline_title AS next_due_title,
                    CASE
                        WHEN p.ethics_expiry_date IS NOT NULL AND p.ethics_expiry_date < CURRENT_DATE THEN 1
                        ELSE 0
                    END AS is_ethics_expired,
                    CASE
                        WHEN p.ethics_expiry_date IS NOT NULL
                            AND p.ethics_expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')::date THEN 1
                        ELSE 0
                    END AS is_ethics_expiring_soon
                FROM research.research_projects p
                LEFT JOIN ref.departments d ON d.department_id = p.lead_department_id
                LEFT JOIN auth.users u ON u.user_id = p.principal_investigator_id
                LEFT JOIN research.sponsors s ON s.sponsor_id = p.sponsor_id
                LEFT JOIN LATERAL (
                    SELECT deadline_title, due_date
                    FROM research.project_deadlines dl
                    WHERE dl.project_id = p.project_id
                        AND dl.deleted_at IS NULL
                        AND dl.deadline_status <> 'completed'
                    ORDER BY dl.due_date
                    LIMIT 1
                ) nd ON true
                WHERE p.deleted_at IS NULL;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE VIEW training.v_training_monthly_summary AS
                SELECT
                    event_year,
                    event_month,
                    COUNT(*) FILTER (WHERE plan_type = 'planned')::int AS planned_count,
                    COUNT(*) FILTER (WHERE plan_type = 'additional')::int AS additional_count,
                    COUNT(*) FILTER (WHERE event_status = 'completed')::int AS actual_count,
                    COUNT(*)::int AS total_plan_count,
                    COUNT(*) FILTER (WHERE event_status <> 'completed')::int AS not_completed_count,
                    CASE
                        WHEN COUNT(*) = 0 THEN 0::numeric(5,2)
                        ELSE ROUND((COUNT(*) FILTER (WHERE event_status = 'completed')::numeric / COUNT(*)::numeric) * 100, 2)::numeric(5,2)
                    END AS completion_rate
                FROM training.training_events
                WHERE deleted_at IS NULL AND is_active = true
                GROUP BY event_year, event_month;
                """);

            migrationBuilder.Sql("""
                CREATE OR REPLACE VIEW notify.v_user_notification_inbox AS
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
                FROM notify.notification_recipients nr
                JOIN notify.notifications n ON n.notification_id = nr.notification_id
                WHERE n.is_deleted = false;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS notify.v_user_notification_inbox;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS training.v_training_monthly_summary;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS research.v_research_project_overview;");

            migrationBuilder.DropTable(
                name: "activity_logs",
                schema: "audit");

            migrationBuilder.DropTable(
                name: "data_change_logs",
                schema: "audit");

            migrationBuilder.DropTable(
                name: "login_events",
                schema: "audit");

            migrationBuilder.DropTable(
                name: "login_sessions",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "notification_recipients",
                schema: "notify");

            migrationBuilder.DropTable(
                name: "notification_settings",
                schema: "notify");

            migrationBuilder.DropTable(
                name: "password_reset_tokens",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "project_deadlines",
                schema: "research");

            migrationBuilder.DropTable(
                name: "project_documents",
                schema: "research");

            migrationBuilder.DropTable(
                name: "project_members",
                schema: "research");

            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "system_settings",
                schema: "ref");

            migrationBuilder.DropTable(
                name: "training_event_logs",
                schema: "training");

            migrationBuilder.DropTable(
                name: "training_event_participants",
                schema: "training");

            migrationBuilder.DropTable(
                name: "user_preferences",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "user_roles",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "notifications",
                schema: "notify");

            migrationBuilder.DropTable(
                name: "project_milestones",
                schema: "research");

            migrationBuilder.DropTable(
                name: "permissions",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "training_events",
                schema: "training");

            migrationBuilder.DropTable(
                name: "roles",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "notification_rules",
                schema: "notify");

            migrationBuilder.DropTable(
                name: "project_phases",
                schema: "research");

            migrationBuilder.DropTable(
                name: "event_categories",
                schema: "training");

            migrationBuilder.DropTable(
                name: "notification_templates",
                schema: "notify");

            migrationBuilder.DropTable(
                name: "research_projects",
                schema: "research");

            migrationBuilder.DropTable(
                name: "sponsors",
                schema: "research");

            migrationBuilder.DropTable(
                name: "users",
                schema: "auth");

            migrationBuilder.DropTable(
                name: "departments",
                schema: "ref");
        }
    }
}
