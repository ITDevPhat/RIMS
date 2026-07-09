# Frontend Backend Mapping

## Tổng quan

Frontend hiện đang dùng mock data và mock auth. Backend Phase 1-4 đã có API thật cho auth/admin/research. Bảng dưới đây là mapping tích hợp đề xuất.

| UI Page | Component/Page File | API Endpoint | Request Payload | Response Fields | Integration Status | Notes |
|---|---|---|---|---|---|---|
| Login | `RIMS/components/pages/LoginPage.tsx`, `RIMS/lib/auth-context.tsx` | `POST /api/auth/login` | `usernameOrEmail`, `password` | `token`, `expiresAt`, `user` | Mock only | Replace mock auth with API client and token storage |
| Profile | `RIMS/components/pages/ThongTinCaNhan.tsx` | `GET /api/auth/me` | Bearer token | `userId`, `email`, `fullName`, `roles`, `permissions`, `preferences` | Mock only | Backend returns camelCase DTO |
| Account preferences | User menu/profile area | `GET/PUT /api/account/preferences` | preferences DTO | appearance/notification booleans | Mock only | UI page exists as profile/settings workflow |
| Dashboard | `RIMS/components/pages/TongQuanTienDo.tsx` | Future `/api/dashboard/*` | filters/year | aggregates | Mock only | Backend dashboard APIs planned |
| Research list | `RIMS/components/pages/DeTaiList.tsx` | `GET /api/research-projects` | query filters | paged `items` | Mock only | Field mapping needed from Vietnamese mock types |
| Research create/edit | `RIMS/components/modals/DeTaiFormModal.tsx` | `POST/PUT /api/research-projects` | project request DTO | `ResearchProjectDto` | Mock only | Backend enum values are English codes |
| Research detail | `RIMS/components/pages/ChiTietDeTai.tsx` | `GET /api/research-projects/{id}`, `/overview` | id | project overview | Mock only | Detail currently composes mock phases/milestones/deadlines |
| Phases | `RIMS/components/pages/QuanLyGiaiDoan.tsx` | `/api/project-phases` | phase DTO | `ProjectPhaseDto` | Mock only | Backend recalculates project progress |
| Milestones | `RIMS/components/pages/QuanLyMocTienDo.tsx` | `/api/project-milestones` | milestone DTO | `ProjectMilestoneDto` | Mock only | DB uses `completed_date`, API exposes `completedAt` |
| Deadlines | `RIMS/components/pages/HanChotPage.tsx` | `/api/project-deadlines` | deadline DTO | `daysRemaining`, `isOverdue`, `severityLabel` | Mock only | Backend has no deadline notes column |
| Training overview | `RIMS/components/pages/MangDaoTaoPage.tsx` | Future `/api/training-*` | TBD | TBD | Mock only | Backend training phase planned |
| Training calendar | `RIMS/components/pages/training/LichDaoTao.tsx` | Future `/api/training-calendar/*` | year/month/week filters | events | Mock only | UI views available |
| Notifications | `RIMS/components/common/NotificationDropdown.tsx`, `TrungTamThongBao.tsx` | Future `/api/notifications` | read/unread actions | notifications | Mock only | Backend notification phase planned |
| Settings | `RIMS/components/pages/CaiDat.tsx` | `/api/settings`, `/api/account/preferences` | setting DTO | paged/list settings | Partial target | UI has placeholders for some tabs |
| Users | `RIMS/components/admin/UserManagementTab.tsx` | `/api/users` | user DTO | paged users | Mock only | Backend ready |
| Roles | `RIMS/components/admin/RoleManagementTab.tsx` | `/api/roles` | role DTO | paged roles | Mock only | Backend ready |
| Permissions | Settings permission tab | `/api/permissions`, `/api/roles/{roleId}/permissions` | permission ids | matrix | Placeholder | Backend ready |
| Audit logs | Settings audit tab | Future audit endpoints | filters | logs | Placeholder | Currently SQL-only verification |

## Contract Mismatches To Handle

- Frontend mock statuses are Vietnamese labels; backend stores English enum-like codes such as `not_started`, `in_progress`, `completed`.
- Frontend `ResearchProject.id/code/name/progress` differs from backend `projectId/projectCode/projectTitle/progressPercent`.
- Frontend date fields are string-based; backend uses `DateOnly` serialized as ISO date strings.
- Backend wraps all responses in `{ success, message, data, errors }`.
- List APIs return `data.items`, `page`, `pageSize`, `totalItems`, `totalPages`.
