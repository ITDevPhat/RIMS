# RMS Production Deployment Guide

This guide deploys the current RMS repository from `D:\ITDevPhat\ASP.NET\RIMS` to a production-demo stack:

```text
Browser
  -> Vercel Next.js frontend
  -> Render ASP.NET Core API
  -> Neon PostgreSQL
```

This is a production-demo deployment guide. It is not a regulated hospital production architecture.

## 1. Architecture

| Layer | Technology | Repository path | Deployment target |
| --- | --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, pnpm | `RIMS` | Vercel |
| Backend API | ASP.NET Core Web API, .NET 8 | `src/Rms.Api` | Render Web Service, Docker |
| Application contracts | C# DTOs and service interfaces | `src/Rms.Application` | Built into API |
| Domain | Constants/domain project | `src/Rms.Domain` | Built into API |
| Infrastructure | EF Core, Npgsql, services, seeders | `src/Rms.Infrastructure` | Built into API |
| Database | PostgreSQL schemas via EF Core migrations | `src/Rms.Infrastructure/Persistence/Migrations/PostgreSql` | Neon PostgreSQL |

Runtime flow:

```text
Browser
  -> https://<vercel-domain>
  -> https://<render-service>.onrender.com/api/*
  -> Neon pooled PostgreSQL endpoint
```

## 2. Repository Structure

Actual important paths:

```text
RIMS/
├── README.md
├── PRODUCTION_DEPLOYMENT_GUIDE.md
├── Dockerfile
├── .dockerignore
├── .gitignore
├── render.yaml
├── Rms.Backend.sln
├── NuGet.config
├── scripts/
│   └── Test-ProductionDeployment.ps1
├── database/
│   └── postgresql/
│       ├── initial-postgresql.sql
│       ├── RMS_PostgreSQL_DDL.md
│       ├── RMS_Seed_PostgreSQL.sql
│       └── verify-production.sql
├── src/
│   ├── Rms.Api/
│   │   ├── Rms.Api.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── Controllers/
│   ├── Rms.Application/
│   ├── Rms.Domain/
│   └── Rms.Infrastructure/
│       ├── DependencyInjection.cs
│       ├── Persistence/RmsDbContext.cs
│       ├── Persistence/Migrations/PostgreSql/
│       ├── Security/
│       └── Services/DevelopmentAdminSeeder.cs
└── RIMS/
    ├── package.json
    ├── pnpm-lock.yaml
    ├── next.config.mjs
    ├── .env.example
    ├── app/
    ├── components/
    └── lib/api/api-client.ts
```

The backend startup project is `src/Rms.Api/Rms.Api.csproj`.

The EF Core infrastructure project is `src/Rms.Infrastructure/Rms.Infrastructure.csproj`.

The frontend root is `RIMS`.

## 3. Current Readiness Status

These commands were actually run locally.

| Check | Command | Actual Result | Status |
| --- | --- | --- | --- |
| .NET SDK information | `dotnet --info` | Completed and saved to `logs/baseline-dotnet-info.log` | PASS |
| Backend restore | `dotnet restore .\Rms.Backend.sln` | Restore completed | PASS |
| Backend build | `dotnet build .\Rms.Backend.sln` | 0 warnings, 0 errors after stopping locked API processes | PASS |
| Backend publish | `dotnet publish .\src\Rms.Api\Rms.Api.csproj --configuration Release --output .\artifacts\publish\rms-api-final /p:UseAppHost=false` | Publish completed | PASS |
| EF migrations list | `dotnet ef migrations list --project .\src\Rms.Infrastructure\Rms.Infrastructure.csproj --startup-project .\src\Rms.Api\Rms.Api.csproj --no-connect` | Found `20260714013637_InitialPostgreSql` | PASS |
| pnpm version | `pnpm --version` | Completed and saved to `logs/baseline-pnpm-version.log` | PASS |
| Frontend install | `pnpm install` from `RIMS` | Completed | PASS |
| Frontend type-check | `pnpm exec tsc --noEmit` from `RIMS` | Completed | PASS |
| Frontend build | `pnpm build` from `RIMS` | Next.js production build completed | PASS |
| Docker daemon | `docker version`; `docker info` | Docker daemon available | PASS |
| Docker image build | `docker build -t rims-api:local .` | Image built successfully | PASS |
| Docker smoke test | `scripts\Test-ProductionDeployment.ps1` against local container | Health, DB, Swagger, login, reads, CRUD create/update/delete passed | PASS |
| Secret scan | `rg --files-with-matches` for secret patterns | No real Neon secret found in source after sanitization; `Connection.txt` contains placeholders only | PASS with rotation warning |

Logs are local under `logs/` and are ignored by Git.

## 4. Security and Secret Rotation

The repository was scanned for:

- `postgresql://`
- `postgres://`
- `npg_`
- `neon.tech`
- `Password=`
- `ConnectionStrings`
- `Jwt:Key`
- `Jwt__Key`
- client secrets, API keys, access tokens, refresh tokens, private keys
- `.env` files
- `Connection.txt`
- appsettings and deployment logs

Important result:

- `Connection.txt` is tracked, but now contains placeholders only.
- `RIMS/.env.local` is ignored and must stay local only.
- `logs/`, `artifacts/`, `.env*`, key/certificate files, dumps, and backups are ignored.
- A real Neon password was previously present in local working material during setup. Rotate exposed Neon credentials before pushing or deploying.

Never commit:

- real Neon connection strings
- `.env.local`
- production appsettings files with secrets
- JWT production secrets
- database dumps
- `.pem`, `.key`, `.pfx` files

Use these secure stores:

- Local development: .NET User Secrets
- Render: environment variables
- Vercel: project environment variables
- CI/CD: secret environment configuration

## 5. Local Configuration

Backend local secrets:

```powershell
dotnet user-secrets set `
  "ConnectionStrings:DefaultConnection" `
  "Host=<NEON_POOLER_HOST>;Port=5432;Database=<DATABASE>;Username=<USER>;Password=<PASSWORD>;SSL Mode=Require;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=10;Timeout=15;Command Timeout=30" `
  --project src/Rms.Api/Rms.Api.csproj
```

Optional local JWT override:

```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$jwt = [Convert]::ToBase64String($bytes)

dotnet user-secrets set "Jwt:Key" $jwt --project src/Rms.Api/Rms.Api.csproj
```

Frontend local environment:

```powershell
Copy-Item RIMS\.env.example RIMS\.env.local
```

For local backend on port `8080`, `RIMS/.env.local` should contain:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The frontend API client automatically appends `/api` if the value does not already end with `/api`.

## 6. Neon Setup

1. Create or select a Neon project.
2. Choose a region close to the Render region.
3. Create a production branch, for example `production`.
4. Use the pooled endpoint for the backend when possible.
5. Rotate any credential that was copied into files, terminal transcripts, screenshots, or chat.
6. Convert the Neon URI to Npgsql ADO.NET format before placing it in Render.

Recommended connection string shape:

```text
Host=<NEON_POOLER_HOST>;
Port=5432;
Database=<DATABASE>;
Username=<USER>;
Password=<PASSWORD>;
SSL Mode=Require;
Pooling=true;
Minimum Pool Size=0;
Maximum Pool Size=10;
Timeout=15;
Command Timeout=30;
```

Do not put the Neon connection string in frontend variables.

The current backend can normalize a Neon URI such as:

```text
postgresql://user:password@host/database?sslmode=require
```

However, the deployment guide standard is still the Npgsql ADO.NET keyword format above. Omit `Channel Binding` unless you specifically need it and have confirmed compatibility. The installed provider is `Npgsql.EntityFrameworkCore.PostgreSQL` version `8.0.11`.

## 7. PostgreSQL Migration

Authoritative schema path for this repository:

1. EF Core migrations create/update schema.
2. C# seeder creates authentication users with the real backend password hasher.
3. SQL seed scripts are optional data helpers, not the preferred way to create login users.

Do not run the full DDL script and EF migrations against the same empty database unless you have verified that it will not duplicate objects.

List migrations:

```powershell
dotnet ef migrations list `
  --project .\src\Rms.Infrastructure\Rms.Infrastructure.csproj `
  --startup-project .\src\Rms.Api\Rms.Api.csproj
```

Apply migrations:

```powershell
dotnet ef database update `
  --project .\src\Rms.Infrastructure\Rms.Infrastructure.csproj `
  --startup-project .\src\Rms.Api\Rms.Api.csproj
```

The current migration is:

```text
20260714013637_InitialPostgreSql
```

Validate production data with:

```powershell
psql "<NPGSQL_OR_URI_CONNECTION_STRING>" `
  -v ON_ERROR_STOP=1 `
  -f .\database\postgresql\verify-production.sql
```

`verify-production.sql` is read-only.

## 8. Seed Data and Demo Administrator

Seeder:

```text
src/Rms.Infrastructure/Services/DevelopmentAdminSeeder.cs
```

The seeder is idempotent and uses `IPasswordService`, which uses BCrypt. It creates the demo administrator and supporting demo data.

Demo administrator:

```text
Email: admin@hospital.vn
Password: demo123
Role: ADMIN
Account status: active
Email confirmed: true
System admin: true
```

Startup flags:

```text
Database__MigrateOnStartup=true|false
Seed__DemoData=true|false
```

For first controlled deployment:

```text
Database__MigrateOnStartup=true
Seed__DemoData=true
```

After the first successful seed:

```text
Seed__DemoData=false
```

Change the demo administrator password before sharing the system.

## 9. Backend Local Validation

Run:

```powershell
dotnet restore .\Rms.Backend.sln
dotnet build .\Rms.Backend.sln
dotnet run --project .\src\Rms.Api\Rms.Api.csproj --launch-profile https
```

Health:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
Invoke-RestMethod http://localhost:8080/api/health/database
```

If using the HTTPS launch profile, use the displayed HTTPS URL instead.

Swagger when enabled:

```text
http://localhost:8080/swagger
http://localhost:8080/swagger/v1/swagger.json
```

Login test:

```powershell
$body = @{
  usernameOrEmail = "admin@hospital.vn"
  password = "demo123"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/auth/login" `
  -ContentType "application/json" `
  -Body $body
```

## 10. Docker Validation

Dockerfile:

```text
Dockerfile
```

It builds from the repository root, restores the real project files, publishes `src/Rms.Api/Rms.Api.csproj`, runs `Rms.Api.dll`, exposes `8080`, and uses the .NET 8 ASP.NET runtime image as a non-root user.

Build:

```powershell
docker build -t rims-api:local .
```

Run a local container with placeholders replaced in your own shell:

```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$jwt = [Convert]::ToBase64String($bytes)

docker run --rm `
  -p 18080:8080 `
  -e ASPNETCORE_ENVIRONMENT=Production `
  -e Swagger__Enabled=true `
  -e Database__MigrateOnStartup=false `
  -e Seed__DemoData=false `
  -e Jwt__Key="$jwt" `
  -e Jwt__Issuer=RMS `
  -e Jwt__Audience=RMS.Admin `
  -e Cors__AllowedOrigins__0=http://localhost:3000 `
  -e "ConnectionStrings__DefaultConnection=Host=<HOST>;Port=5432;Database=<DATABASE>;Username=<USER>;Password=<PASSWORD>;SSL Mode=Require;Pooling=true;Maximum Pool Size=10" `
  rims-api:local
```

Smoke test:

```powershell
.\scripts\Test-ProductionDeployment.ps1 `
  -ApiBaseUrl "http://localhost:18080" `
  -AdminEmail "admin@hospital.vn" `
  -AdminPassword "demo123"
```

The script does not print the password or full JWT token.

## 11. GitHub Push

Review before staging:

```powershell
git status --short
git diff --stat
git diff
```

Run another secret scan without printing values:

```powershell
rg --files-with-matches -I "npg_" -g "!**/bin/**" -g "!**/obj/**" -g "!**/node_modules/**" -g "!**/.next/**"
rg --files-with-matches -I "neon.tech" -g "!**/bin/**" -g "!**/obj/**" -g "!**/node_modules/**" -g "!**/.next/**"
rg --files-with-matches -I "postgresql://" -g "!**/bin/**" -g "!**/obj/**" -g "!**/node_modules/**" -g "!**/.next/**"
```

Stage and inspect:

```powershell
git add .
git diff --cached --name-only
git diff --cached
```

Commit and push only after confirming no secrets are staged:

```powershell
git commit -m "Prepare RMS production deployment"
git branch -M main
git push -u origin main
```

Verify on GitHub:

- `Dockerfile` exists at repository root.
- `.dockerignore` exists at repository root.
- `render.yaml` contains no secret values.
- `.env.local` is not committed.
- Neon passwords are not visible.
- Database dumps are not committed.
- Backend path is `src/Rms.Api`.
- Frontend path is `RIMS`.

## 12. Render Deployment

Manual Render setup:

1. Open Render Dashboard.
2. New -> Web Service.
3. Connect the GitHub repository.
4. Select branch `main`.
5. Runtime: Docker.
6. Root Directory: leave blank.
7. Dockerfile Path: `./Dockerfile`.
8. Instance Type: Free for demo.
9. Health Check Path: `/api/health`.
10. Auto Deploy: Yes.
11. Choose a region close to Neon.
12. Create Web Service.

Render injects `PORT`; do not manually define it. The API reads `PORT` and binds to `0.0.0.0`.

Render Free may sleep after inactivity. The first request after sleep can be slow.

The repository includes `render.yaml` as an optional blueprint. It uses `sync:false` for secret values.

## 13. Render Environment Variables

Use these keys exactly:

| Key | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | Npgsql ADO.NET connection string with placeholders replaced in Render only |
| `Jwt__Key` | strong random secret |
| `Jwt__Issuer` | `RMS` |
| `Jwt__Audience` | `RMS.Admin` |
| `Swagger__Enabled` | `true` for initial validation, later `false` if desired |
| `Database__MigrateOnStartup` | `true` for first deploy if you want Render to apply migrations, later usually `false` |
| `Seed__DemoData` | `true` only for first controlled demo seed, then `false` |
| `Cors__AllowedOrigins__0` | initial local origin or final Vercel origin |
| `Cors__AllowedOrigins__1` | optional `http://localhost:3000` for local development |

Generate a JWT key locally without saving it:

```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Copy only the generated value into Render `Jwt__Key`.

## 14. Backend Production Verification

After Render deploy:

```powershell
$api = "https://<render-service>.onrender.com"

Invoke-RestMethod "$api/api/health"
Invoke-RestMethod "$api/api/health/database"
Invoke-WebRequest "$api/swagger/v1/swagger.json"
```

Run the smoke test:

```powershell
.\scripts\Test-ProductionDeployment.ps1 `
  -ApiBaseUrl "https://<render-service>.onrender.com" `
  -AdminEmail "admin@hospital.vn" `
  -AdminPassword "demo123"
```

If Swagger is disabled:

```powershell
.\scripts\Test-ProductionDeployment.ps1 `
  -ApiBaseUrl "https://<render-service>.onrender.com" `
  -AdminEmail "admin@hospital.vn" `
  -AdminPassword "demo123" `
  -SkipSwagger
```

## 15. Vercel Deployment

1. Open Vercel Dashboard.
2. Add New -> Project.
3. Import the GitHub repository.
4. Root Directory: `RIMS`.
5. Framework Preset: Next.js.
6. Install Command: `pnpm install`.
7. Build Command: `pnpm build`.
8. Environment Variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com
```

Do not include `/api` unless you want to. The current frontend accepts either:

```text
https://<render-service>.onrender.com
https://<render-service>.onrender.com/api
```

It normalizes trailing slashes and avoids `/api/api`.

Do not put database credentials in Vercel.

## 16. Render CORS Update

After Vercel gives you a production domain, update Render:

```text
Cors__AllowedOrigins__0=https://<actual-vercel-domain>
Cors__AllowedOrigins__1=http://localhost:3000
```

Rules:

- No trailing slash.
- Do not use `AllowAnyOrigin` in production.
- This API uses JWT Bearer tokens, so `AllowCredentials` is not required.
- Vercel preview domains need their own explicit CORS origins unless you add a controlled pattern in code later.

Redeploy or restart the Render service after changing environment variables.

## 17. End-to-End Verification

Backend:

- `/api/health`
- `/api/health/database`
- `/swagger`
- `/swagger/v1/swagger.json`
- `/api/auth/login`
- `/api/auth/me`
- `/api/research-projects`
- `/api/project-phases`
- `/api/project-milestones`
- `/api/project-deadlines`
- `/api/training-events`
- `/api/notifications`

Frontend:

- Login page
- Dashboard
- De tai nghien cuu
- Giai doan
- Moc tien do
- Han chot & Canh bao
- Mang dao tao
- Thong bao
- Nguoi dung
- Vai tro
- Quyen han
- Nhat ky he thong
- Settings/theme pages if enabled

Browser DevTools:

- No CORS errors.
- No mixed-content errors.
- No calls to `localhost`.
- No `/api/api` paths.
- No unexpected `401`.
- API responses come from Render.
- Data comes from Neon.

## 18. CRUD Smoke Tests

Use:

```powershell
.\scripts\Test-ProductionDeployment.ps1 `
  -ApiBaseUrl "https://<render-service>.onrender.com" `
  -AdminEmail "admin@hospital.vn" `
  -AdminPassword "demo123"
```

The script:

1. Checks web health.
2. Checks Neon health.
3. Checks Swagger JSON unless skipped.
4. Logs in with the real endpoint.
5. Reads `/api/auth/me`.
6. Reads research projects, phases, milestones, deadlines, training events, notifications.
7. Creates a temporary research project.
8. Updates it.
9. Deletes it unless `-SkipCrudCleanup` is passed.

## 19. Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `Couldn't set postgresql://...` | Raw Neon URI passed to Npgsql keyword parser | Use ADO.NET format or current normalized backend code |
| `password authentication failed` | Wrong Neon password, wrong branch/user, or stale env var overriding user-secrets | Rotate/check Neon credential; clear `ConnectionStrings__DefaultConnection` env var |
| Channel Binding error | Driver/runtime incompatibility or endpoint setting mismatch | Omit `Channel Binding` unless required |
| `relation already exists` | DDL script and EF migrations both applied | Use EF migrations as authoritative schema path |
| EF migration history missing | Schema created outside EF | Reconcile database or start with clean branch and EF migrations |
| Schema mismatch | App and DB migration not aligned | Run `dotnet ef database update` or enable `Database__MigrateOnStartup=true` once |
| Null NOT NULL constraint | Seed data incompatible with migration | Use C# seeder or update seed script |
| CORS blocked | Vercel domain missing from Render `Cors__AllowedOrigins__*` | Add exact origin without trailing slash |
| `/api/api` path | Frontend base URL and client both appended `/api` in old code | Current client normalizes; rebuild frontend |
| JWT invalid issuer | `Jwt__Issuer` mismatch | Use `RMS` unless code/config changed |
| JWT invalid audience | `Jwt__Audience` mismatch | Use `RMS.Admin` unless code/config changed |
| Swagger unavailable | `Swagger__Enabled=false` or route blocked | Enable temporarily or use `-SkipSwagger` |
| Render port binding failure | App not listening on `0.0.0.0:$PORT` | Current `Program.cs` handles `PORT` |
| Render health check failure | Health path points to database check | Use `/api/health`, not `/api/health/database` |
| Neon timeout | Cold start, network, or pool too large | Retry, keep `Maximum Pool Size=10`, check Neon compute |
| Frontend calls localhost | Wrong Vercel `NEXT_PUBLIC_API_BASE_URL` | Set it to Render URL and redeploy |
| Docker build path not found | Wrong root or Dockerfile path | Build from repo root with `docker build -t rims-api:local .` |
| DLL not found | Docker `ENTRYPOINT` mismatched project | Current Dockerfile uses `Rms.Api.dll` |
| EF migration startup failure | DB unavailable during app startup | Use `Database__MigrateOnStartup=false` after initial setup |

## 20. Rollback Procedure

Render:

1. Open the Web Service.
2. Go to Deploys.
3. Select a previous successful deploy.
4. Roll back or redeploy that commit.
5. Check `/api/health`.
6. Check `/api/health/database`.

Vercel:

1. Open Project -> Deployments.
2. Promote or redeploy a previous working deployment.
3. Confirm `NEXT_PUBLIC_API_BASE_URL`.
4. Re-test login.

Database:

- Prefer Neon branch restore or backup restore.
- Do not run destructive SQL without a backup.
- Do not reset migrations blindly.

## 21. Post-Deployment Hardening

Before sharing:

- Rotate any exposed Neon credentials.
- Change `admin@hospital.vn` password.
- Set `Seed__DemoData=false`.
- Consider `Swagger__Enabled=false`.
- Set `Database__MigrateOnStartup=false` after initial migration.
- Review JWT expiration.
- Review refresh-token/session policy.
- Configure backup/export process.
- Configure monitoring and alerting.
- Configure a custom domain.
- Review CORS origins.
- Review audit retention.
- Review file storage separately.

Do not store PHI or real patient data in this demo deployment.

## 22. Free-Tier Limitations

This is production-demo infrastructure.

Do not store:

- real patient names
- medical record numbers
- personal phone numbers
- national ID numbers
- protected health information
- real ethics documents with identifiable patient data
- clinical files containing PHI
- unencrypted secrets

Free-tier realities:

- Render Free may spin down after inactivity.
- First request after sleep may be slow.
- Neon Free has resource and transfer limits.
- Vercel Hobby has usage and commercial limitations.
- Free tiers do not provide hospital-grade SLA.
- Paid infrastructure is required for real hospital production.

## 23. Final Checklist

| Item | Expected |
| --- | --- |
| Git secret scan | No real secrets |
| `.env.local` | Not committed |
| `Connection.txt` | Placeholders only |
| Backend build | Pass |
| Backend publish | Pass |
| Frontend type-check | Pass |
| Frontend build | Pass |
| Docker build | Pass |
| Docker smoke test | Pass |
| EF migrations | `20260714013637_InitialPostgreSql` visible |
| Neon branch | Production branch selected |
| Render health path | `/api/health` |
| Render `PORT` | Not manually defined |
| Render DB env | ADO.NET Npgsql format |
| Render JWT env | `Jwt__Key` strong secret |
| Render Swagger | Enabled only for validation if public |
| Render seed | Disabled after first demo seed |
| Vercel root | `RIMS` |
| Vercel API env | Render service base URL |
| CORS | Exact Vercel origin configured |
| Smoke script | Pass |
| Demo admin password | Changed before sharing |
