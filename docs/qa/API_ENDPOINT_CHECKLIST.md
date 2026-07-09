# API Endpoint Checklist

| Method | Endpoint | Auth Required | Tested | Pass/Fail | Notes |
|---|---|---:|---:|---:|---|
| GET | `/swagger/index.html` | No | Yes | PASS | Swagger opened |
| GET | `/api/health` | No | Yes | PASS | Healthy |
| GET | `/api/health/db` | No | Yes | PASS | Connected to `RMS` |
| POST | `/api/auth/login` | No | Yes | PASS | Valid and invalid credentials |
| POST | `/api/auth/logout` | Yes | Yes | PASS | Login event written |
| GET | `/api/auth/me` | Yes | Yes | PASS | 401 without token |
| POST | `/api/auth/change-password` | Yes | Yes | PASS | Complexity checked |
| GET | `/api/users` | Yes | Yes | PASS | Pagination/search |
| GET | `/api/users/{id}` | Yes | Yes | PASS | DTO only |
| POST | `/api/users` | Yes | Yes | PASS | Audit written |
| PUT | `/api/users/{id}` | Yes | Yes | PASS | Audit written |
| PUT | `/api/users/{id}/lock` | Yes | Yes | PASS | Locked user cannot login |
| PUT | `/api/users/{id}/unlock` | Yes | Yes | PASS | User active again |
| POST | `/api/users/{id}/reset-password` | Yes | Yes | PASS | Temporary password returned |
| DELETE | `/api/users/{id}` | Yes | Yes | PASS | Soft delete |
| GET | `/api/roles` | Yes | Yes | PASS | Includes user count |
| GET | `/api/roles/{id}` | Yes | Yes | PASS | DTO only |
| POST | `/api/roles` | Yes | Yes | PASS | Unique role code |
| PUT | `/api/roles/{id}` | Yes | Yes | PASS | Audit written |
| DELETE | `/api/roles/{id}` | Yes | Yes | PASS | Soft delete |
| GET | `/api/permissions` | Yes | Yes | PASS | Permission code format checked |
| GET | `/api/roles/{roleId}/permissions` | Yes | Yes | PASS | Matrix grouped by module |
| PUT | `/api/roles/{roleId}/permissions` | Yes | Yes | PASS | Body: `{ "permissionIds": [] }` |
| GET | `/api/settings` | Yes | Yes | PASS | Handles empty list |
| POST | `/api/settings` | Yes | Yes | PASS | Audit written |
| GET | `/api/settings/{key}` | Yes | Yes | PASS | Key lookup |
| PUT | `/api/settings/{key}` | Yes | Yes | PASS | Key update |
| GET | `/api/settings/group/{groupCode}` | Yes | Yes | PASS | Group lookup |
| GET | `/api/account/preferences` | Yes | Yes | PASS | Creates default if absent |
| PUT | `/api/account/preferences` | Yes | Yes | PASS | Save/read works |
| GET | `/api/research-projects` | Yes | Yes | PASS | Filters checked |
| GET | `/api/research-projects/{id}` | Yes | Yes | PASS | DTO only |
| GET | `/api/research-projects/{id}/overview` | Yes | Yes | PASS | Counts/deadline summary |
| POST | `/api/research-projects` | Yes | Yes | PASS | Validation checked |
| PUT | `/api/research-projects/{id}` | Yes | Yes | PASS | Audit written |
| DELETE | `/api/research-projects/{id}` | Yes | Yes | PASS | Soft delete |
| GET | `/api/project-phases` | Yes | Yes | PASS | Filters checked |
| GET | `/api/project-phases/{id}` | Yes | Yes | PASS | DTO only |
| POST | `/api/project-phases` | Yes | Yes | PASS | Validation checked |
| PUT | `/api/project-phases/{id}` | Yes | Yes | PASS | Recalculates project progress |
| DELETE | `/api/project-phases/{id}` | Yes | Yes | PASS | Soft delete |
| GET | `/api/project-milestones` | Yes | Yes | PASS | Filters checked |
| GET | `/api/project-milestones/{id}` | Yes | Yes | PASS | DTO only |
| POST | `/api/project-milestones` | Yes | Yes | PASS | `completed_date` mapped to `completedAt` |
| PUT | `/api/project-milestones/{id}` | Yes | Yes | PASS | Audit written |
| DELETE | `/api/project-milestones/{id}` | Yes | Yes | PASS | Soft delete |
| GET | `/api/project-deadlines` | Yes | Yes | PASS | Computed fields checked |
| GET | `/api/project-deadlines/{id}` | Yes | Yes | PASS | DTO only |
| POST | `/api/project-deadlines` | Yes | Yes | PASS | `daysRemaining` returned |
| PUT | `/api/project-deadlines/{id}` | Yes | Yes | PASS | Audit written |
| PUT | `/api/project-deadlines/{id}/mark-completed` | Yes | Yes | PASS | Status/completedAt updated |
| DELETE | `/api/project-deadlines/{id}` | Yes | Yes | PASS | Soft delete |
| GET | `/api/sponsors` | Yes | Yes | PASS | Empty/list success |
| GET | `/api/project-members` | Yes | Yes | PASS | Empty/list success |
| POST | `/api/project-members` | Yes | Yes | PASS | Create/list checked |
| GET | `/api/project-documents` | Yes | Yes | PASS | Empty/list success |
| POST | `/api/project-documents` | Yes | Yes | PASS | Create/list checked |
