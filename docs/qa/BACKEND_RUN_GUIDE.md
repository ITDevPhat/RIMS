# Backend Run Guide

## Prerequisites

- .NET SDK 8+
- SQL Server 2019+
- SQL Server database named `RMS`
- `db.sql` executed successfully
- Optional: `dotnet-ef` 8.x for EF database-first scaffolding

## Connection String Setup

Keep local database credentials in one of:

- `src/Rms.Api/appsettings.Development.json`
- .NET user-secrets
- environment variables

Do not put real secrets in shared documentation or production config.

Example placeholder:

```json
{
  "ConnectionStrings": {
    "RmsDatabase": "Server=<SQL_SERVER>;Database=RMS;User Id=<SQL_USER>;Password=<SQL_PASSWORD>;Encrypt=True;TrustServerCertificate=True"
  }
}
```

## Restore

```powershell
dotnet restore Rms.Backend.sln
```

## Build

```powershell
dotnet build Rms.Backend.sln
```

Expected:

```txt
Build succeeded.
0 Warning(s)
0 Error(s)
```

## Run

```powershell
dotnet run --project src/Rms.Api/Rms.Api.csproj --launch-profile http
```

## URLs

- API base: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger/index.html`
- Health: `http://localhost:5000/api/health`
- DB health: `http://localhost:5000/api/health/db`

## Development Login

Use placeholders in documentation:

```txt
Email: <DEV_ADMIN_EMAIL>
Password: <DEV_ADMIN_PASSWORD>
```

The actual local values should come from development configuration or user-secrets.

## Common Errors And Fixes

| Error | Fix |
|---|---|
| Broken NuGet source | Use repo-local `NuGet.config` with `nuget.org` |
| DLL locked during build | Stop the running `Rms.Api` process, then rebuild |
| SQL login failed | Check SQL Server auth mode and local development connection string |
| Swagger 401 on protected endpoints | Click Authorize and paste a valid bearer token |
| CORS error from frontend | Confirm frontend origin is in `Cors:AllowedOrigins` |
| 403 response | User is authenticated but missing required permission |
| Empty settings list | Expected until settings are seeded or created |
