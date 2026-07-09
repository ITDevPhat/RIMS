# Phase 4 Research Report

## Implemented endpoints

- `GET /api/research-projects`
- `GET /api/research-projects/{id}`
- `GET /api/research-projects/{id}/overview`
- `POST /api/research-projects`
- `PUT /api/research-projects/{id}`
- `DELETE /api/research-projects/{id}`
- `GET /api/project-phases`
- `GET /api/project-phases/{id}`
- `POST /api/project-phases`
- `PUT /api/project-phases/{id}`
- `DELETE /api/project-phases/{id}`
- `GET /api/project-milestones`
- `GET /api/project-milestones/{id}`
- `POST /api/project-milestones`
- `PUT /api/project-milestones/{id}`
- `DELETE /api/project-milestones/{id}`
- `GET /api/project-deadlines`
- `GET /api/project-deadlines/{id}`
- `POST /api/project-deadlines`
- `PUT /api/project-deadlines/{id}`
- `PUT /api/project-deadlines/{id}/complete`
- `DELETE /api/project-deadlines/{id}`
- `GET /api/project-members`
- `POST /api/project-members`
- `PUT /api/project-members/{id}`
- `DELETE /api/project-members/{id}`
- `GET /api/project-documents`
- `POST /api/project-documents`
- `PUT /api/project-documents/{id}`
- `DELETE /api/project-documents/{id}`
- `GET /api/sponsors`
- `POST /api/sponsors`
- `PUT /api/sponsors/{id}`
- `DELETE /api/sponsors/{id}`

## DTOs, services, controllers

- DTOs and request/query models: `Rms.Application/Research/ResearchDtos.cs`
- Service interface: `IResearchService`
- Service implementation: `ResearchService`
- Controllers: `ResearchProjectsController`, `ProjectPhasesController`, `ProjectMilestonesController`, `ProjectDeadlinesController`, `ProjectMembersController`, `ProjectDocumentsController`, `SponsorsController`

## Build status

PASS: `dotnet build Rms.Backend.sln --no-restore` completed with 0 warnings and 0 errors.

## Smoke test results

- `GET /api/research-projects`: PASS
- `GET /api/project-phases`: PASS
- `GET /api/project-milestones`: PASS
- `GET /api/project-deadlines`: PASS
- Authenticated access with JWT: PASS
- Anonymous access rejected: PASS

## Schema mismatches

- `research.project_milestones` uses `completed_date`; API maps this to `completedAt`.
- `research.project_deadlines` has no `notes` column; API returns `notes: null`.

## Remaining issues

- File upload storage is not implemented; project document endpoints store metadata only.
- Export endpoints are not part of Phase 4 implementation.
