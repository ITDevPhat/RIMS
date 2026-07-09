# Database QA Report

## Database Name

`RMS`

## Schemas Detected

- `ref`
- `auth`
- `research`
- `training`
- `notify`
- `audit`

## Tables Checked

| Schema | Tables |
|---|---|
| `ref` | `departments`, `system_settings` |
| `auth` | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_preferences`, `login_sessions` |
| `research` | `research_projects`, `project_phases`, `project_milestones`, `project_deadlines`, `sponsors`, `project_members`, `project_documents` |
| `audit` | `login_events`, `activity_logs`, `data_change_logs` |

## Seed Data Checked

| Seed | Result | Notes |
|---|---:|---|
| Development admin | PASS | Created in Development only |
| ADMIN role | PASS | Exists |
| ADMIN permissions | PASS | Granted all required permissions |
| Required `permission.*` codes | PASS | `permission.view`, `permission.update`, `permission.configure` exist |
| `ref.system_settings` | PARTIAL | May be empty by default; API handles it |

## Schema Mismatches

- `research.project_milestones` uses `completed_date`; API maps it to DTO field `completedAt`.
- `research.project_deadlines` has no `notes` column; API returns `notes: null`.
- Public audit endpoints are not implemented; audit QA uses direct database queries.

## Missing Seed Data

- System settings seed data is minimal/empty.
- No production-safe seed users should be added until deployment policy is defined.

## Data Integrity Risks

- Development/test records should be soft-deleted after QA runs.
- Some optional reference/lookups may be missing for future training/notification modules.
- Password and connection string values should not be committed in shared production config.

## Recommended Seed Scripts

Add idempotent seed scripts for:

1. Baseline system settings.
2. Production-safe role/permission matrix.
3. Default notification reminder settings.
4. Lookup values for research statuses, risk levels, priorities, deadline types, and training event types.

Use placeholders for secrets:

```txt
<SQL_SERVER>
<SQL_USER>
<SQL_PASSWORD>
<JWT_SECRET>
<DEV_ADMIN_EMAIL>
<DEV_ADMIN_PASSWORD>
```
