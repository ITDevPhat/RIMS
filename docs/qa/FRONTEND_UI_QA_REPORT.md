# Frontend UI QA Report

Date: 2026-07-05

Scope: `RIMS/` Next.js/React/Tailwind/shadcn-style UI only. Backend, database, backend docs, and API implementation were not modified.

## Summary

- Build status: pass.
- TypeScript status: pass after UI-only fixes.
- Dev server: verified at `http://127.0.0.1:3000`.
- Backend base expected by future integration: `http://localhost:5000`.
- UI bugs found: 5.
- UI bugs fixed: 5.
- Remaining UI/product risks: 3.

## Verification Performed

- Installed dependencies with `npm install --no-package-lock` because `node_modules` was missing.
- Ran `npm run build`: passed.
- Ran `npx tsc --noEmit`: initially failed, then passed after fixes.
- Started frontend dev server on port 3000.
- Browser smoke-tested login, dashboard, sidebar/topbar, research list, phases, milestones, deadlines, training overview/calendar/event list/statistics/settings, and system settings/admin tabs.
- Checked a phone-width viewport around 390px after login.
- Checked browser console errors during smoke navigation: none observed.

## Bugs Fixed

1. Missing `components/ui/alert-dialog.tsx`
   - Impact: `ConfirmationDialog` could not type-check or import correctly.
   - Fix: added a Base UI-backed alert dialog wrapper matching existing UI wrapper style.

2. Base UI trigger API mismatch in notification dropdown
   - Impact: `DropdownMenuTrigger asChild` is Radix-style and invalid for the installed Base UI wrapper.
   - Fix: moved button classes/attributes directly onto `DropdownMenuTrigger`.

3. Base UI tooltip API mismatch in sidebar
   - Impact: `delayDuration` and `TooltipTrigger asChild` failed direct TypeScript validation.
   - Fix: changed to `delay` and `render={menuButton}`.

4. Nullable select values not guarded
   - Impact: Base UI select can emit `string | null`; direct setters/handlers failed TypeScript.
   - Fix: guarded null values in research project and training event filters/forms.

5. Mobile dashboard shell pushed content off-screen
   - Impact: after mobile login, the fixed 260px sidebar left the main dashboard at `left = 260px` on a phone viewport.
   - Fix: narrow screens now auto-collapse the sidebar and use a 72px content offset. Verified `mainLeft = 72`, `scrollWidth = viewport width`.

## Remaining Risks

1. Frontend is still mock-data/mock-auth based. API integration remains future work.
2. Several admin/settings tabs are placeholders: notification rules, permission management content, and audit log content.
3. Dense tables intentionally rely on horizontal scrolling; individual data-grid responsiveness should be revisited during API integration with real row lengths.

## Files Changed

- `RIMS/components/common/NotificationDropdown.tsx`
- `RIMS/components/layout/AdminLayout.tsx`
- `RIMS/components/layout/Sidebar.tsx`
- `RIMS/components/modals/DeTaiFormModal.tsx`
- `RIMS/components/pages/training/DanhSachSuKien.tsx`
- `RIMS/components/ui/alert-dialog.tsx`
- `docs/qa/FRONTEND_UI_QA_REPORT.md`
- `docs/qa/FRONTEND_UI_CHECKLIST.md`
- `docs/qa/FRONTEND_RUN_GUIDE.md`
