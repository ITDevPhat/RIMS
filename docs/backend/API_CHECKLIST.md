# Backend API Checklist

| Phase | Module | Method | Endpoint | Auth Required | Tested | Result | Notes |
|---|---|---:|---|---|---|---|---|
| 1 | Health | GET | `/api/health` | No | Yes | PASS | Basic health |
| 1 | Health | GET | `/api/health/db` | No | Yes | PASS | SQL Server connection |
| 2 | Auth | POST | `/api/auth/login` | No | Yes | PASS | JWT issued |
| 2 | Auth | GET | `/api/auth/me` | Yes | Yes | PASS | Profile, roles, permissions |
| 2 | Auth | POST | `/api/auth/logout` | Yes | Partial | PASS | Implemented |
| 2 | Auth | POST | `/api/auth/change-password` | Yes | Partial | PASS | Implemented |
| 3 | Users | GET | `/api/users` | Yes | Yes | PASS | Paginated |
| 3 | Roles | GET | `/api/roles` | Yes | Yes | PASS | Paginated |
| 3 | Permissions | GET | `/api/permissions` | Yes | Yes | PASS | Permission matrix supported |
| 3 | Settings | GET | `/api/settings` | Yes | Yes | PASS | Paginated |
| 4 | Research Projects | GET | `/api/research-projects` | Yes | Yes | PASS | Paginated |
| 4 | Project Phases | GET | `/api/project-phases` | Yes | Yes | PASS | Paginated |
| 4 | Project Milestones | GET | `/api/project-milestones` | Yes | Yes | PASS | Paginated |
| 4 | Project Deadlines | GET | `/api/project-deadlines` | Yes | Yes | PASS | Paginated |
| 4 | Project Members | GET | `/api/project-members` | Yes | Partial | PASS | Implemented |
| 4 | Project Documents | GET | `/api/project-documents` | Yes | Partial | PASS | Metadata only |
| 4 | Sponsors | GET | `/api/sponsors` | Yes | Partial | PASS | Implemented |
| 5 | Training Events | GET | `/api/training-events` | Yes | Yes | PASS | Paginated |
| 5 | Training Calendar | GET | `/api/training-calendar/week` | Yes | Yes | PASS | Monday week start |
| 5 | Training Calendar | GET | `/api/training-calendar/month` | Yes | Yes | PASS | 6-week grid |
| 5 | Training Calendar | GET | `/api/training-calendar/year` | Yes | Yes | PASS | 12 months |
| 5 | Training Calendar | GET | `/api/training-calendar/schedule` | Yes | Partial | PASS | Implemented |
| 5 | Training Statistics | GET | `/api/training-statistics/yearly` | Yes | Yes | PASS | Yearly summary |
| 5 | Training Categories | GET | `/api/training-categories` | Yes | Yes | PASS | Uses `event_categories` |
| 6 | Notifications | GET | `/api/notifications` | Yes | Yes | PASS | Current user inbox |
| 6 | Notifications | GET | `/api/notifications/unread-count` | Yes | Yes | PASS | Current user count |
| 6 | Notification Rules | GET | `/api/notification-rules` | Yes | Yes | PASS | Paginated |
| 6 | Notification Settings | GET | `/api/notification-settings` | Yes | Yes | PASS | System settings |
| 6 | Notification Jobs | POST | `/api/jobs/notification-scan` | Yes | Yes | PASS | Manual scanner |
| 7 | Dashboard | GET | `/api/dashboard/research-overview` | Yes | Yes | PASS | Research aggregate |
| 7 | Dashboard | GET | `/api/dashboard/training-overview` | Yes | Yes | PASS | Training aggregate |
| 7 | Dashboard | GET | `/api/dashboard/deadlines` | Yes | Yes | PASS | Upcoming and overdue items |
| 7 | Audit Logs | GET | `/api/audit-logs` | Yes | Yes | PASS | Paginated, sensitive JSON omitted |
| 7 | Audit Logs | GET | `/api/audit-logs/{id}` | Yes | Yes | PASS | Detail |
| 7 | Login Events | GET | `/api/login-events` | Yes | Yes | PASS | Paginated |
| 7 | Login Events | GET | `/api/login-events/{id}` | Yes | Yes | PASS | Detail |
| All | Swagger | GET | `/swagger/v1/swagger.json` | No | Yes | PASS | OpenAPI generated |
| All | Security | GET | `/api/users` without JWT | Yes | Yes | PASS | Rejected with 401/403 |
