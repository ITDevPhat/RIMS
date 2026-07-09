# Phase 6 Notification Report

## Implemented endpoints

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `GET /api/notifications/{id}`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/{id}/unread`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/{id}`
- `GET /api/notification-rules`
- `GET /api/notification-rules/{id}`
- `POST /api/notification-rules`
- `PUT /api/notification-rules/{id}`
- `DELETE /api/notification-rules/{id}`
- `PUT /api/notification-rules/{id}/enable`
- `PUT /api/notification-rules/{id}/disable`
- `GET /api/notification-settings`
- `PUT /api/notification-settings`
- `POST /api/jobs/notification-scan`

## Notification settings behavior

- Uses `notify.notification_settings` system row when available.
- Creates a default system row when missing.
- Stores reminder day lists as JSON arrays.
- Maps `daily_scan_time` hour to `scannerRunHour`.
- Development background scanner is configured as disabled by default.

## Scanner behavior

- Detects project deadlines due soon and overdue.
- Detects training events upcoming in configured days.
- Detects ethics approval expiry.
- Detects projects ending soon.
- Detects milestones and phases due soon.
- Recipient priority: responsible user, principal investigator, system admins for high or urgent items, fallback to system admins.

## Duplicate prevention logic

Before creating a recipient, the scanner checks existing notifications for:

- `notificationType`
- `relatedEntityType`
- `relatedEntityId`
- `userId`

Reminder days are encoded into generated `notificationType`, for example `deadline_due_3`.

## Build status

PASS: `dotnet build Rms.Backend.sln --no-restore` completed with 0 warnings and 0 errors after Phase 6.

## Smoke test results

- `GET /api/notifications`: PASS
- `GET /api/notifications/unread-count`: PASS
- `GET /api/notification-rules`: PASS
- `GET /api/notification-settings`: PASS
- `POST /api/jobs/notification-scan`: PASS, created 0 notifications and 0 recipients because no matching due items existed at test time

## Schema mismatches

- Database stores action label as `suggested_action`; API returns it as `actionLabel`.
- Database has no `related_entity_name`; API returns `relatedEntityName: null`.
- Rule table uses `object_type` and `reminder_days`; API maps them to `targetType` and `remindBeforeDays`.

## Remaining issues

- Email delivery is not implemented; the schema is ready for status tracking.
- Notification templates are scaffolded but not exposed as CRUD endpoints in Phase 6.
