-- RMS production-demo verification script for PostgreSQL/Neon.
-- Read-only checks only. This script must not modify data.

\echo 'RMS production verification started'

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('auth', 'audit', 'notify', 'ref', 'research', 'training')
ORDER BY schema_name;

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('auth', 'audit', 'notify', 'ref', 'research', 'training')
  AND table_name IN (
    'users',
    'roles',
    'permissions',
    'research_projects',
    'project_phases',
    'project_milestones',
    'project_deadlines',
    'project_members',
    'training_events',
    'notifications',
    'notification_recipients'
  )
ORDER BY table_schema, table_name;

SELECT "MigrationId", "ProductVersion"
FROM "__EFMigrationsHistory"
ORDER BY "MigrationId";

SELECT 'users' AS entity, COUNT(*) AS total FROM auth.users WHERE deleted_at IS NULL
UNION ALL
SELECT 'roles', COUNT(*) FROM auth.roles WHERE deleted_at IS NULL
UNION ALL
SELECT 'permissions', COUNT(*) FROM auth.permissions
UNION ALL
SELECT 'research_projects', COUNT(*) FROM research.research_projects WHERE deleted_at IS NULL
UNION ALL
SELECT 'project_phases', COUNT(*) FROM research.project_phases WHERE deleted_at IS NULL
UNION ALL
SELECT 'project_milestones', COUNT(*) FROM research.project_milestones WHERE deleted_at IS NULL
UNION ALL
SELECT 'project_deadlines', COUNT(*) FROM research.project_deadlines WHERE deleted_at IS NULL
UNION ALL
SELECT 'training_events', COUNT(*) FROM training.training_events WHERE deleted_at IS NULL
UNION ALL
SELECT 'notifications', COUNT(*) FROM notify.notifications WHERE is_deleted = false
ORDER BY entity;

SELECT COUNT(*) AS orphan_phases
FROM research.project_phases p
LEFT JOIN research.research_projects r ON r.project_id = p.project_id
WHERE p.deleted_at IS NULL
  AND (r.project_id IS NULL OR r.deleted_at IS NOT NULL);

SELECT COUNT(*) AS orphan_milestones
FROM research.project_milestones m
LEFT JOIN research.research_projects r ON r.project_id = m.project_id
LEFT JOIN research.project_phases p ON p.phase_id = m.phase_id
WHERE m.deleted_at IS NULL
  AND (
    r.project_id IS NULL
    OR r.deleted_at IS NOT NULL
    OR (m.phase_id IS NOT NULL AND (p.phase_id IS NULL OR p.deleted_at IS NOT NULL))
  );

SELECT COUNT(*) AS orphan_deadlines
FROM research.project_deadlines d
LEFT JOIN research.research_projects r ON r.project_id = d.project_id
LEFT JOIN research.project_phases p ON p.phase_id = d.phase_id
LEFT JOIN research.project_milestones m ON m.milestone_id = d.milestone_id
WHERE d.deleted_at IS NULL
  AND (
    (d.project_id IS NOT NULL AND (r.project_id IS NULL OR r.deleted_at IS NOT NULL))
    OR (d.phase_id IS NOT NULL AND (p.phase_id IS NULL OR p.deleted_at IS NOT NULL))
    OR (d.milestone_id IS NOT NULL AND (m.milestone_id IS NULL OR m.deleted_at IS NOT NULL))
  );

SELECT COUNT(*) AS orphan_project_members
FROM research.project_members pm
LEFT JOIN research.research_projects r ON r.project_id = pm.project_id
LEFT JOIN auth.users u ON u.user_id = pm.user_id
WHERE r.project_id IS NULL
   OR r.deleted_at IS NOT NULL
   OR u.user_id IS NULL
   OR u.deleted_at IS NOT NULL;

SELECT COUNT(*) AS orphan_notification_recipients
FROM notify.notification_recipients nr
LEFT JOIN notify.notifications n ON n.notification_id = nr.notification_id
LEFT JOIN auth.users u ON u.user_id = nr.user_id
WHERE n.notification_id IS NULL
   OR n.is_deleted = true
   OR u.user_id IS NULL
   OR u.deleted_at IS NOT NULL;

SELECT 'research_projects.project_status_null' AS check_name, COUNT(*) AS total
FROM research.research_projects
WHERE deleted_at IS NULL AND project_status IS NULL
UNION ALL
SELECT 'project_phases.phase_status_null', COUNT(*)
FROM research.project_phases
WHERE deleted_at IS NULL AND phase_status IS NULL
UNION ALL
SELECT 'project_milestones.milestone_status_null', COUNT(*)
FROM research.project_milestones
WHERE deleted_at IS NULL AND milestone_status IS NULL
UNION ALL
SELECT 'project_deadlines.deadline_status_null', COUNT(*)
FROM research.project_deadlines
WHERE deleted_at IS NULL AND deadline_status IS NULL
UNION ALL
SELECT 'training_events.event_status_null', COUNT(*)
FROM training.training_events
WHERE deleted_at IS NULL AND event_status IS NULL;

SELECT 'invalid_project_status' AS check_name, COUNT(*) AS total
FROM research.research_projects
WHERE deleted_at IS NULL
  AND project_status NOT IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')
UNION ALL
SELECT 'invalid_phase_status', COUNT(*)
FROM research.project_phases
WHERE deleted_at IS NULL
  AND phase_status NOT IN ('not_started', 'in_progress', 'completed', 'at_risk', 'paused', 'cancelled')
UNION ALL
SELECT 'invalid_milestone_status', COUNT(*)
FROM research.project_milestones
WHERE deleted_at IS NULL
  AND milestone_status NOT IN ('not_started', 'in_progress', 'completed', 'at_risk', 'cancelled')
UNION ALL
SELECT 'invalid_deadline_status', COUNT(*)
FROM research.project_deadlines
WHERE deleted_at IS NULL
  AND deadline_status NOT IN ('open', 'in_progress', 'completed', 'cancelled', 'overdue')
UNION ALL
SELECT 'invalid_training_event_status', COUNT(*)
FROM training.training_events
WHERE deleted_at IS NULL
  AND event_status NOT IN ('planned', 'scheduled', 'completed', 'cancelled', 'postponed', 'not_completed');

SELECT 'research_project_id_sequence_lag' AS check_name,
       GREATEST(
         COALESCE((SELECT MAX(project_id) FROM research.research_projects), 0)
         - COALESCE((SELECT last_value FROM research.research_projects_project_id_seq), 0),
         0
       ) AS total
WHERE to_regclass('research.research_projects_project_id_seq') IS NOT NULL;

\echo 'RMS production verification finished'
