# Changelog

| Date | Area | Change | Notes |
|---|---|---|---|
| 2026-07-05 | Backend | Created ASP.NET Core 8 solution structure | `Rms.Api`, `Rms.Application`, `Rms.Domain`, `Rms.Infrastructure` |
| 2026-07-05 | Backend | Added EF Core database-first scaffold | Auth/ref/audit/research schemas |
| 2026-07-05 | Backend | Implemented foundation | JWT, Swagger, CORS, response envelope, middleware, health endpoints |
| 2026-07-05 | Backend | Implemented auth | Login/logout/me/change-password, sessions, audit events |
| 2026-07-05 | Backend | Implemented admin APIs | Users, roles, permissions, settings, account preferences |
| 2026-07-05 | Backend | Implemented research APIs | Projects, phases, milestones, deadlines, sponsors, members, documents |
| 2026-07-05 | Backend QA | Fixed role permission update request shape | Body now uses `{ "permissionIds": [...] }` |
| 2026-07-05 | Backend QA | Fixed project member creation mapping | Query created member by id |
| 2026-07-05 | Frontend QA | Fixed UI build/type issues | Base UI API mismatches, alert dialog wrapper, nullable selects |
| 2026-07-05 | Frontend QA | Fixed mobile layout issue | Narrow view auto-collapses sidebar |
| 2026-07-05 | Documentation | Added QA and project docs | No real secrets in generated docs |
