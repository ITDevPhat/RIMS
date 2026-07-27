# RMS Project Deep Dive for PostgreSQL Hosting

This document summarizes how the RMS monorepo is organized and how PostgreSQL fits into the runtime, local development, and deployment model.

## System Purpose

RMS is a Research Management System for hospital research and training operations. The application combines:

- a Next.js administrative frontend in `RIMS/`;
- an ASP.NET Core Web API backend in `src/Rms.Api/`;
- application contracts and service interfaces in `src/Rms.Application/`;
- domain constants in `src/Rms.Domain/`;
- EF Core, Npgsql, persistence entities, migrations, and service implementations in `src/Rms.Infrastructure/`;
- PostgreSQL database scripts and verification helpers in `database/postgresql/`.

## Runtime Architecture

```text
Browser
  -> Next.js frontend (`RIMS`)
  -> ASP.NET Core API (`src/Rms.Api`)
  -> Application service interfaces (`src/Rms.Application`)
  -> Infrastructure services (`src/Rms.Infrastructure`)
  -> EF Core DbContext (`RmsDbContext`)
  -> PostgreSQL database
```

The production-demo target described by the repository is:

```text
Browser
  -> Vercel-hosted Next.js frontend
  -> Render-hosted ASP.NET Core API
  -> Neon-hosted PostgreSQL
```

## Backend Projects

| Project | Responsibility |
| --- | --- |
| `src/Rms.Api` | HTTP controllers, authentication/authorization configuration, CORS, Swagger, error middleware, startup orchestration |
| `src/Rms.Application` | DTOs, request models, response models, service interfaces, common API response wrappers |
| `src/Rms.Domain` | Permission codes and domain-level constants |
| `src/Rms.Infrastructure` | EF Core `RmsDbContext`, PostgreSQL migrations, scaffolded persistence entities, security helpers, service implementations, background services |

The API startup path is `src/Rms.Api/Program.cs`. Infrastructure is registered through `builder.Services.AddInfrastructure(builder.Configuration)`, which wires PostgreSQL via `UseNpgsql`.

## Frontend Structure

The Next.js application is in `RIMS/`. Important areas include:

| Path | Responsibility |
| --- | --- |
| `RIMS/app/` | Next.js app entry points, layout, global styles |
| `RIMS/components/layout/` | Admin shell, sidebar, topbar, navigation |
| `RIMS/components/pages/` | Research, deadlines, profile, settings, report pages |
| `RIMS/components/pages/training/` | Training module pages |
| `RIMS/components/admin/` | User and role management UI |
| `RIMS/lib/api/` | Typed API clients that call backend endpoints |
| `RIMS/lib/mappers/` | API-to-UI mapping helpers |
| `RIMS/lib/mock-*.ts` | Legacy/mock data still used by some UI areas |

The API client reads `NEXT_PUBLIC_API_BASE_URL`, normalizes it, and appends `/api` when needed.

## PostgreSQL Data Model

The repository treats PostgreSQL as the active database. The main schemas are:

| Schema | Purpose |
| --- | --- |
| `ref` | Reference data such as departments |
| `auth` | Users, roles, permissions, login sessions, password reset tokens |
| `research` | Research projects, phases, milestones, deadlines, members, documents, sponsors |
| `training` | Training events, event categories, participants, logs, monthly summaries |
| `notify` | Notifications, notification recipients, settings, rules, templates |
| `audit` | Activity logs, data change logs, login events |

EF Core migrations under `src/Rms.Infrastructure/Persistence/Migrations/PostgreSql/` are the preferred way to create or update the PostgreSQL schema. SQL files under `database/postgresql/` are useful for review, validation, or controlled manual setup, but should not be mixed blindly with EF migrations on the same empty database.

## PostgreSQL Connection Configuration

Never commit a real PostgreSQL connection string. The backend reads the value from `ConnectionStrings:DefaultConnection`.

For local development, use .NET User Secrets:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=<POSTGRES_HOST>;Port=5432;Database=<DATABASE>;Username=<USER>;Password=<PASSWORD>;SSL Mode=Require;Trust Server Certificate=true" --project src/Rms.Api/Rms.Api.csproj
```

For deployed environments, use an environment variable:

```text
ConnectionStrings__DefaultConnection=Host=<POSTGRES_HOST>;Port=5432;Database=<DATABASE>;Username=<USER>;Password=<PASSWORD>;SSL Mode=Require;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=10;Timeout=15;Command Timeout=30
```

The infrastructure layer also accepts PostgreSQL URI formats such as `postgresql://user:password@host/database?sslmode=require` and normalizes them to an Npgsql connection string.

## Migration and Startup Strategy

The backend has two relevant feature flags:

| Setting | Meaning |
| --- | --- |
| `Database:MigrateOnStartup` | Applies EF Core migrations at API startup when enabled |
| `Seed:DemoData` | Runs the development admin seeder when enabled |

Recommended approach:

1. For local/dev demo environments, it is acceptable to enable startup migrations and demo seeding.
2. For production-like environments, prefer applying migrations explicitly during deployment and keep startup migration disabled unless the host workflow is intentionally designed around it.
3. Keep demo credentials disabled or overridden in real environments.

## Deployment Checklist for PostgreSQL Hosting

Before deploying the backend against PostgreSQL:

1. Create the PostgreSQL database/branch in the hosting provider.
2. Store the connection string only in the host secret/environment settings.
3. Configure a strong `Jwt:Key` or `Jwt__Key` secret.
4. Configure CORS with the actual frontend origin in `Cors:AllowedOrigins`.
5. Apply EF Core migrations or intentionally enable `Database:MigrateOnStartup` for that environment.
6. Seed only the data needed for the environment.
7. Run health checks:
   - `/api/health`
   - `/api/health/database`
8. Validate key flows: login, dashboard reads, research CRUD, training reads, notification endpoints as applicable.

## Current Risk Areas to Watch

- Some frontend files still contain mock data modules, so verify each page is connected to the real API before treating it as production-ready.
- Keep PostgreSQL as the source of truth; avoid drifting between older SQL Server scripts and PostgreSQL migrations.
- Do not put database connection strings in frontend environment variables because `NEXT_PUBLIC_*` values are exposed to browsers.
- Rotate any credential that was pasted into local files, terminal history, screenshots, or chat during setup.
- Review `Database:MigrateOnStartup` and `Seed:DemoData` per environment so production does not accidentally run demo behavior.
