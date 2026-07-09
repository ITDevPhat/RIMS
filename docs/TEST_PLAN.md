# Test Plan

## Manual UI Test Plan

- Login/logout UI
- Sidebar expanded/collapsed
- Mobile layout around 390px width
- Dashboard cards/timeline/deadline sections
- Research list/detail/create/edit/delete UI
- Phase/milestone/deadline UI flows
- Training tabs and calendar view switches
- Notification dropdown and notification center
- Settings/admin tabs

## API Test Plan

- Health and DB connection
- Auth happy path and failure path
- Protected endpoint 401 without token
- Permission 403 for missing permission
- Users CRUD and soft delete
- Role CRUD and role permission matrix
- Settings CRUD and group/key lookup
- Account preferences read/write
- Research project CRUD, filters, validation
- Phase CRUD and project progress recalculation
- Milestone CRUD and `completedAt` mapping
- Deadline CRUD, computed fields, mark completed
- Audit event generation

## E2E Workflow Test Plan

### Workflow 1 - Login/Profile

1. Open frontend.
2. Login with `<DEV_ADMIN_EMAIL>` / `<DEV_ADMIN_PASSWORD>`.
3. Land on dashboard.
4. Open profile/account settings/change password UI.
5. Logout.

Current status: UI passes with mock auth. Backend auth passes separately. Full API-backed login not wired yet.

### Workflow 2 - Research Project

1. Create project.
2. Edit project.
3. Open detail.
4. Add phase.
5. Add milestone.
6. Add deadline.
7. Mark deadline completed.
8. Delete test records.

Current status: Backend passes. Frontend UI passes with mock data. Full API-backed UI workflow pending.

### Workflow 3 - Training Event

1. Open training module.
2. Switch calendar views.
3. Create/edit/delete event.

Current status: UI mock workflow available. Backend training APIs planned.

### Workflow 4 - Notification

1. Open notification bell.
2. Mark all as read.
3. Open notification center.
4. Mark read/unread.

Current status: UI mock workflow available. Backend notification APIs planned.

### Workflow 5 - Settings/Admin

1. Create user.
2. Lock/unlock user.
3. Reset password.
4. Create/edit role.
5. Update permission matrix.

Current status: Backend passes. Frontend admin UI mock/partial integration pending.

## Regression Checklist

- [ ] `dotnet build Rms.Backend.sln`
- [ ] `npm run build`
- [ ] `npx tsc --noEmit`
- [ ] Swagger opens
- [ ] Frontend opens
- [ ] Login auth works
- [ ] `/api/health/db` works
- [ ] Protected APIs reject no-token requests
- [ ] Research CRUD smoke test passes

## Security Test Checklist

- [ ] No real secrets in docs
- [ ] Password hashes never returned
- [ ] JWT required for protected APIs
- [ ] Missing permissions return 403
- [ ] CORS restricted to configured frontend origins
- [ ] Development connection string kept in local config/user-secrets
- [ ] Swagger protected endpoints require bearer token
