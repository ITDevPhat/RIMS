# Frontend UI QA Checklist

Date: 2026-07-05

## Build And Runtime

- [x] Dependency install checked.
- [x] `npm run build` passes.
- [x] `npx tsc --noEmit` passes.
- [x] Dev server starts on port 3000.
- [x] Browser console has no observed errors during smoke navigation.

## Authentication UI

- [x] Login page renders hospital/RMS branding.
- [x] Username/email and password fields render.
- [x] Empty credentials show validation error.
- [x] Demo login succeeds.
- [x] Logout control is available from topbar user menu.
- [ ] Real backend login integration not implemented in frontend yet.

## Layout And Navigation

- [x] Sidebar renders all expected primary modules.
- [x] Sidebar collapse/expand works.
- [x] Topbar search, notification trigger, and user menu render.
- [x] Dashboard content renders after login.
- [x] Mobile shell no longer starts with the main content pushed off-screen.

## Research Module

- [x] Dashboard aggregate cards render.
- [x] Research project list renders.
- [x] Project detail navigation renders.
- [x] Phase page renders.
- [x] Milestone page renders.
- [x] Deadline page renders.
- [x] Add project drawer opens from project list.
- [ ] API-backed CRUD behavior not validated.

## Training Module

- [x] Training overview renders.
- [x] Calendar view renders.
- [x] Event list view renders.
- [x] Year statistics view renders.
- [x] Training settings tab renders.
- [x] Training filters type-check with nullable select values guarded.
- [ ] Export action is UI-only.

## Notifications

- [x] Notification dropdown opens from topbar.
- [x] Unread badge renders.
- [x] Mark-as-read controls render.
- [ ] Notification center/page integration not wired from topbar.

## Settings And Admin

- [x] System settings page renders.
- [x] User management tab renders.
- [x] Role management tab renders.
- [x] Permission tab route renders.
- [x] Audit tab route renders.
- [ ] Permission and audit tab bodies are placeholder content.
- [ ] Admin mutations are mock/UI-only.

## Responsive Risks

- [x] Login page fits phone-width viewport.
- [x] Dashboard shell fits phone-width viewport after sidebar fix.
- [ ] Large data tables should be reviewed again with real backend data.
