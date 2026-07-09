# Phase 5 Training Report

## Implemented endpoints

- `GET /api/training-events`
- `GET /api/training-events/{id}`
- `POST /api/training-events`
- `PUT /api/training-events/{id}`
- `DELETE /api/training-events/{id}`
- `GET /api/training-calendar/week?date=2026-07-06`
- `GET /api/training-calendar/month?year=2026&month=7`
- `GET /api/training-calendar/year?year=2026`
- `GET /api/training-calendar/schedule?fromDate=2026-07-01&toDate=2026-07-31`
- `GET /api/training-statistics/yearly?year=2026`
- `GET /api/training-categories`
- `GET /api/training-categories/{id}`
- `POST /api/training-categories`
- `PUT /api/training-categories/{id}`
- `DELETE /api/training-categories/{id}`

## Calendar response shapes

- Week view returns `startDate`, `endDate`, and 7 day objects with `date`, Vietnamese `dayName`, `isToday`, and `events`.
- Month view returns `year`, `month`, `monthName`, and 6 week rows including previous/next month filler days.
- Year view always returns 12 monthly summary objects.
- Schedule view groups events by `plannedDate` with Vietnamese date labels.

## Statistics calculation rules

- `plannedCount`: `plan_type = planned`
- `additionalCount`: `plan_type = additional`
- `actualCount`: `event_status = completed`
- `totalPlan`: planned + additional
- `notCompletedCount`: `max(totalPlan - actualCount, 0)`
- `completionRate`: `actualCount / totalPlan * 100`, rounded to 2 decimals
- `peakMonth`: month with highest `totalPlan`, then highest `actualCount`

## Build status

PASS: `dotnet build Rms.Backend.sln --no-restore` completed with 0 warnings and 0 errors after Phase 5.

## Smoke test results

- `GET /api/training-events`: PASS
- `GET /api/training-calendar/week`: PASS
- `GET /api/training-calendar/month`: PASS
- `GET /api/training-calendar/year`: PASS, returned 12 months
- `GET /api/training-statistics/yearly`: PASS
- `GET /api/training-categories`: PASS

## Schema mismatches

- Database table is `training.event_categories`, not `training.training_categories`.
- Database uses `event_description`, `planned_attendees`, `actual_attendees`, and `cancellation_reason`; API maps these to `description`, `expectedParticipants`, `actualParticipants`, and `cancelReason`.
- Database includes `event_type`; API accepts it and defaults to `other` when omitted.

## Remaining issues

- Participant management endpoints are not included in Phase 5 scope.
- Export endpoints are not included in Phase 5 scope.
