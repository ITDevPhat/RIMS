# Kiến Trúc Hệ Thống

## Frontend Architecture

Frontend nằm trong thư mục `RIMS/` và là Next.js client app. Màn hình chính được điều phối bởi `RIMS/app/page.tsx`, dùng state `activePage` thay vì route URL riêng cho từng page.

Các nhóm chính:

- `RIMS/components/layout/`: sidebar, topbar, admin shell
- `RIMS/components/pages/`: dashboard, nghiên cứu, hạn chót, cài đặt
- `RIMS/components/pages/training/`: đào tạo, lịch, thống kê
- `RIMS/components/admin/`: user/role admin UI
- `RIMS/components/modals/`: form/drawer/modal
- `RIMS/lib/`: mock data, types, auth context

## Backend Architecture

Backend theo cấu trúc solution:

```text
Rms.Backend.sln
src/
  Rms.Api/
  Rms.Application/
  Rms.Domain/
  Rms.Infrastructure/
```

Trách nhiệm:

| Project | Vai trò |
|---|---|
| `Rms.Api` | Controllers, middleware, Swagger, auth/CORS config |
| `Rms.Application` | DTOs, request/response models, service interfaces |
| `Rms.Domain` | Permission constants/domain constants |
| `Rms.Infrastructure` | EF DbContext, scaffolded entities, services, JWT/password/audit |

## Database Schemas

Database: `RMS`

Schemas:

- `ref`
- `auth`
- `research`
- `training`
- `notify`
- `audit`

EF Core dùng PostgreSQL qua Npgsql. EF migrations trong `src/Rms.Infrastructure/Persistence/Migrations/PostgreSql/` là source of truth cho schema hiện tại.

## Request Flow

```text
Frontend UI
  -> API client (future integration)
  -> ASP.NET Controller
  -> Application service interface
  -> Infrastructure service
  -> RmsDbContext
  -> PostgreSQL RMS
```

## Auth Flow

```text
POST /api/auth/login
  -> Find user by username/email
  -> Check account_status
  -> Verify BCrypt password
  -> Create auth.login_sessions
  -> Write audit.login_events
  -> Return JWT + profile + roles + permissions
```

Protected requests send:

```text
Authorization: Bearer <JWT_TOKEN>
```

## Permission Flow

- JWT contains role claims and `permission` claims.
- `[RequirePermission("module.action")]` maps to an authorization policy.
- Missing permission returns 403.
- No token returns 401.

## Notification Flow

Notification database schema exists under `notify`. Backend notification services, rules, scanner, and controllers are implemented; some frontend notification UI areas may still rely on mock data until fully wired to API clients.

## Audit Flow

Services write:

- `audit.login_events` for login/logout/password events
- `audit.activity_logs` for create/update/delete/configure actions

Public audit query endpoints are not implemented yet.

## Folder Structure

```text
docs/
docs/qa/
RIMS/
src/Rms.Api/
src/Rms.Application/
src/Rms.Domain/
src/Rms.Infrastructure/
db.sql
NuGet.config
Rms.Backend.sln
```
