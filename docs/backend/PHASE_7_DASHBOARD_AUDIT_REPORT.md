# Phase 7 Dashboard And Audit Report

## Implemented endpoints

- `GET /api/dashboard/research-overview?year=2026`
- `GET /api/dashboard/training-overview?year=2026`
- `GET /api/dashboard/deadlines?days=30`
- `GET /api/audit-logs`
- `GET /api/audit-logs/{id}`
- `GET /api/login-events`
- `GET /api/login-events/{id}`

## Build result

PASS: `dotnet build Rms.Backend.sln --no-restore` completed with 0 warnings and 0 errors.

## Smoke test result

- `GET /api/dashboard/research-overview?year=2026`: PASS
- `GET /api/dashboard/training-overview?year=2026`: PASS
- `GET /api/dashboard/deadlines?days=30`: PASS
- `GET /api/audit-logs`: PASS
- `GET /api/audit-logs/{id}`: PASS
- `GET /api/login-events`: PASS
- `GET /api/login-events/{id}`: PASS
- `GET /swagger/v1/swagger.json`: PASS
- Dashboard endpoint without JWT: rejected with 401/403

## DTOs, services, controllers created

- DTOs and query models: `Rms.Application/Dashboard/DashboardDtos.cs`
- Service interfaces: `IDashboardService`, `IAuditQueryService`
- Service implementation: `DashboardService`
- Controllers: `DashboardController`, `AuditLogsController`, `LoginEventsController`

## Dashboard notes

- Research overview uses selected year, active statuses, 7-day due soon, 30-day ethics expiry, health summary, attention reasons, and Gantt project phases.
- Training overview returns yearly totals, 12-month summary, current month count, and status distribution.
- Deadline dashboard returns upcoming 7 days, upcoming configurable days, overdue deadlines, ethics expiry, and training events.

## Audit notes

- Activity logs are returned from `audit.activity_logs`.
- Login events are returned from `audit.login_events`.
- Sensitive JSON payloads such as `old_value_json` and `new_value_json` are intentionally not exposed.
- Passwords and tokens are not exposed.

## Schema mismatches

- There is no dedicated dashboard table or view; aggregates are calculated from existing research, training, and audit tables.
- There is no `performed_by_name` column in `audit.activity_logs`; API resolves it through the `auth.users` relationship.

## Remaining issues

- Audit log endpoints are authenticated but do not yet have a dedicated `audit.view` permission because the current permission seed does not define one.
- Dashboard aggregates are optimized for current UI/API use; heavy production datasets may need reporting views or indexes later.
