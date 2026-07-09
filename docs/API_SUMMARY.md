# API Summary

| Module | Method | Endpoint | Description | Auth | Permission | Status |
|---|---|---|---|---:|---|---|
| Health | GET | `/api/health` | API health | No | - | Done |
| Health | GET | `/api/health/db` | DB connection check | No | - | Done |
| Auth | POST | `/api/auth/login` | Login and issue JWT | No | - | Done |
| Auth | POST | `/api/auth/logout` | Logout current session | Yes | Authenticated | Done |
| Auth | GET | `/api/auth/me` | Current user profile | Yes | Authenticated | Done |
| Auth | POST | `/api/auth/change-password` | Change password | Yes | Authenticated | Done |
| Users | GET | `/api/users` | List users | Yes | `user.view` | Done |
| Users | GET | `/api/users/{id}` | User detail | Yes | `user.view` | Done |
| Users | POST | `/api/users` | Create user | Yes | `user.create` | Done |
| Users | PUT | `/api/users/{id}` | Update user | Yes | `user.update` | Done |
| Users | DELETE | `/api/users/{id}` | Soft delete user | Yes | `user.delete` | Done |
| Users | PUT | `/api/users/{id}/lock` | Lock user | Yes | `user.update` | Done |
| Users | PUT | `/api/users/{id}/unlock` | Unlock user | Yes | `user.update` | Done |
| Users | POST | `/api/users/{id}/reset-password` | Reset password | Yes | `user.update` | Done |
| Roles | GET | `/api/roles` | List roles | Yes | `role.view` | Done |
| Roles | GET | `/api/roles/{id}` | Role detail | Yes | `role.view` | Done |
| Roles | POST | `/api/roles` | Create role | Yes | `role.create` | Done |
| Roles | PUT | `/api/roles/{id}` | Update role | Yes | `role.update` | Done |
| Roles | DELETE | `/api/roles/{id}` | Soft delete role | Yes | `role.delete` | Done |
| Permissions | GET | `/api/permissions` | List permissions | Yes | `permission.view` | Done |
| Permissions | GET | `/api/permissions/matrix` | Permission modules | Yes | `permission.view` | Done |
| Permissions | PUT | `/api/permissions/{id}` | Update permission metadata | Yes | `permission.update` | Done |
| Role Permissions | GET | `/api/roles/{roleId}/permissions` | Role matrix | Yes | `permission.view` | Done |
| Role Permissions | PUT | `/api/roles/{roleId}/permissions` | Update role permissions | Yes | `permission.configure` | Done |
| Settings | GET | `/api/settings` | List settings | Yes | `setting.view` | Done |
| Settings | POST | `/api/settings` | Create setting | Yes | `setting.configure` | Done |
| Settings | GET | `/api/settings/{key}` | Setting by key | Yes | `setting.view` | Done |
| Settings | PUT | `/api/settings/{key}` | Update setting by key | Yes | `setting.update` | Done |
| Settings | GET | `/api/settings/group/{groupCode}` | Settings by group | Yes | `setting.view` | Done |
| Account | GET | `/api/account/preferences` | Read preferences | Yes | Authenticated | Done |
| Account | PUT | `/api/account/preferences` | Update preferences | Yes | Authenticated | Done |
| Research | GET | `/api/research-projects` | List projects | Yes | `research_project.view` | Done |
| Research | GET | `/api/research-projects/{id}` | Project detail | Yes | `research_project.view` | Done |
| Research | GET | `/api/research-projects/{id}/overview` | Project overview | Yes | `research_project.view` | Done |
| Research | POST | `/api/research-projects` | Create project | Yes | `research_project.create` | Done |
| Research | PUT | `/api/research-projects/{id}` | Update project | Yes | `research_project.update` | Done |
| Research | DELETE | `/api/research-projects/{id}` | Soft delete project | Yes | `research_project.delete` | Done |
| Phases | GET | `/api/project-phases` | List phases | Yes | `project_phase.view` | Done |
| Phases | POST | `/api/project-phases` | Create phase | Yes | `project_phase.create` | Done |
| Phases | PUT | `/api/project-phases/{id}` | Update phase | Yes | `project_phase.update` | Done |
| Phases | DELETE | `/api/project-phases/{id}` | Soft delete phase | Yes | `project_phase.delete` | Done |
| Milestones | GET | `/api/project-milestones` | List milestones | Yes | `project_milestone.view` | Done |
| Milestones | POST | `/api/project-milestones` | Create milestone | Yes | `project_milestone.create` | Done |
| Milestones | PUT | `/api/project-milestones/{id}` | Update milestone | Yes | `project_milestone.update` | Done |
| Milestones | DELETE | `/api/project-milestones/{id}` | Soft delete milestone | Yes | `project_milestone.delete` | Done |
| Deadlines | GET | `/api/project-deadlines` | List deadlines | Yes | `project_deadline.view` | Done |
| Deadlines | POST | `/api/project-deadlines` | Create deadline | Yes | `project_deadline.create` | Done |
| Deadlines | PUT | `/api/project-deadlines/{id}` | Update deadline | Yes | `project_deadline.update` | Done |
| Deadlines | PUT | `/api/project-deadlines/{id}/mark-completed` | Complete deadline | Yes | `project_deadline.update` | Done |
| Deadlines | DELETE | `/api/project-deadlines/{id}` | Soft delete deadline | Yes | `project_deadline.delete` | Done |
| Sponsors | GET | `/api/sponsors` | List sponsors | Yes | `research_project.view` | Done |
| Members | GET | `/api/project-members` | List project members | Yes | `research_project.view` | Done |
| Documents | GET | `/api/project-documents` | List project documents | Yes | `research_project.view` | Done |
| Training | GET/POST/PUT/DELETE | `/api/training-*` | Training APIs | Yes | `training_event.*` | Done |
| Notifications | GET/PUT/DELETE | `/api/notifications` | Notification APIs | Yes | `notification.*` | Done |
| Notification Rules | GET/POST/PUT/DELETE | `/api/notification-rules` | Notification rules | Yes | `notification.configure` | Done |
| Notification Settings | GET/PUT | `/api/notification-settings` | Notification settings | Yes | `notification.configure` | Done |
| Notification Jobs | POST | `/api/jobs/notification-scan` | Manual scanner | Yes | `notification.configure` | Done |
| Dashboard | GET | `/api/dashboard/research-overview` | Research dashboard aggregate | Yes | `dashboard.view` | Done |
| Dashboard | GET | `/api/dashboard/training-overview` | Training dashboard aggregate | Yes | `dashboard.view` | Done |
| Dashboard | GET | `/api/dashboard/deadlines` | Deadline dashboard aggregate | Yes | `dashboard.view` | Done |
| Audit | GET | `/api/audit-logs` | Activity audit logs | Yes | Authenticated | Done |
| Audit | GET | `/api/audit-logs/{id}` | Activity audit log detail | Yes | Authenticated | Done |
| Login Events | GET | `/api/login-events` | Login event logs | Yes | Authenticated | Done |
| Login Events | GET | `/api/login-events/{id}` | Login event detail | Yes | Authenticated | Done |
