# Backend/API/DB QA Report

## Summary

Agent 2 backend QA was run against the ASP.NET Core 8 RMS backend, SQL Server database `RMS`, and live API at `http://localhost:5000`.

Overall result: **PASS**

## Build Result

| Check | Result | Notes |
|---|---:|---|
| `dotnet restore Rms.Backend.sln` | PASS | All projects up to date |
| `dotnet build Rms.Backend.sln` | PASS | 0 warnings, 0 errors |
| Swagger | PASS | `http://localhost:5000/swagger/index.html` returned 200 |

## Database Connection Result

| Check | Result | Notes |
|---|---:|---|
| `GET /api/health` | PASS | API returned healthy response |
| `GET /api/health/db` | PASS | Connected to database `RMS` |
| Schemas detected | PASS | `ref`, `auth`, `research`, `training`, `notify`, `audit` |

## Auth Test Result

| Check | Result | Notes |
|---|---:|---|
| Valid login | PASS | JWT returned |
| Invalid login | PASS | Returned 401 |
| `/api/auth/me` with token | PASS | Returned profile, roles, permissions, preferences |
| `/api/auth/me` without token | PASS | Returned 401 |
| Change password | PASS | Validated current password and complexity |
| Logout | PASS | Wrote login event |
| Password hash exposure | PASS | No password hash returned in API responses checked |

## Admin API Result

| Area | Result | Notes |
|---|---:|---|
| Users CRUD | PASS | Create, get, update, lock, unlock, reset password, soft delete tested |
| Roles CRUD | PASS | Create, update, soft delete tested |
| Permissions | PASS | List and role permission matrix tested |
| Settings | PASS | List, create, get by key, update by key, group lookup tested |
| Account preferences | PASS | Read/write tested |
| Permission authorization | PASS | User without permission received 403 |

## Research API Result

| Area | Result | Notes |
|---|---:|---|
| Research projects | PASS | Create, duplicate-code validation, filters, update, soft delete tested |
| Project phases | PASS | Create, update, validation, filters, progress recalculation tested |
| Project milestones | PASS | Create, update, filters, `completed_date` mapping checked |
| Project deadlines | PASS | Create, update, mark completed, computed fields checked |
| Sponsors | PASS | List endpoint checked |
| Project members | PASS | Create/list checked |
| Project documents | PASS | Create/list checked |

## Audit Result

Audit was verified through direct database queries because public audit endpoints are not implemented yet.

Recent audit records were found for:
- `login_success`
- `login_failed`
- `logout`
- `password_changed`
- `password_reset`
- user create/update/delete
- role create/update/delete
- setting create/update/delete
- research project create/update/delete
- project phase/milestone/deadline create/update/delete

## Security Findings

| Check | Result | Notes |
|---|---:|---|
| Protected endpoints reject no token | PASS | 401 |
| Missing permission returns 403 | PASS | Verified with limited QA user |
| Password hash hidden | PASS | DTOs do not expose password hash |
| Swagger bearer auth | PASS | JWT works in protected calls |
| CORS | PASS | Configured through appsettings for frontend origins |
| Secrets in generated docs | PASS | Docs use placeholders only |

## Bugs Found

1. `PUT /api/roles/{roleId}/permissions` had an ambiguous raw list body contract.
2. `CreateMemberAsync` fetched the newly-created member through page 1, which could fail when existing members were present.

## Bugs Fixed

1. Added `UpdateRolePermissionsRequest` with body shape `{ "permissionIds": [...] }`.
2. Updated `CreateMemberAsync` to query the created member by `projectMemberId`.

## Remaining Issues

- Public audit APIs (`/api/audit-logs`, `/api/login-events`) are not implemented; audit verification currently uses SQL.
- `ref.system_settings` may be empty until settings are created by admin/API.
- Development credentials and connection string must stay in local secret config, not production config.
- Training, notification, dashboard/audit public modules are not complete yet.

## Recommendation Before Frontend Integration

Backend is ready for frontend integration for Phase 1-4 modules: auth, admin, account preferences, settings, and research tracking. Next backend development phase should be Training APIs, then Notification APIs, then Dashboard/Audit APIs.
