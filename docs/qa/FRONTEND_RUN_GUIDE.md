# Frontend Run Guide

## Prerequisites

- Node.js available on the machine.
- Backend API expected at `http://localhost:5000` for future integration.
- Frontend app path: `D:\ITDevPhat\ASP.NET\RIMS\RIMS`.

## Install

From `D:\ITDevPhat\ASP.NET\RIMS\RIMS`:

```powershell
npm install --no-package-lock
```

The repository already includes `pnpm-lock.yaml`; the QA pass avoided generating a new npm lockfile.

## Build

```powershell
npm run build
```

Recommended extra type check:

```powershell
npx tsc --noEmit
```

## Run Dev Server

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://localhost:3000
```

## Demo Login

Use the local demo account configured for your environment:

```text
Email: <DEV_ADMIN_EMAIL>
Password: <DEV_ADMIN_PASSWORD>
```

Do not put real production credentials in frontend docs or source files.

## QA Notes

- `npm run build` passed on 2026-07-05.
- `npx tsc --noEmit` passed on 2026-07-05.
- Dev smoke test passed on `127.0.0.1:3000`.
- `npm install` reported two moderate npm advisories. Package upgrades were not performed because dependency changes are outside this UI QA scope.
