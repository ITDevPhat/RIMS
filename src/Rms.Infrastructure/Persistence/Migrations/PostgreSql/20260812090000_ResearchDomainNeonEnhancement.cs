using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Rms.Infrastructure.Persistence;

#nullable disable

namespace Rms.Infrastructure.Persistence.Migrations.PostgreSql;

[DbContext(typeof(RmsDbContext))]
[Migration("20260812090000_ResearchDomainNeonEnhancement")]
public partial class ResearchDomainNeonEnhancement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
ALTER TABLE research.research_projects
 ADD COLUMN IF NOT EXISTS principal_investigator_name varchar(255),
 ADD COLUMN IF NOT EXISTS principal_investigator_email varchar(255),
 ADD COLUMN IF NOT EXISTS registration_date date,
 ADD COLUMN IF NOT EXISTS registration_date_precision varchar(10) NOT NULL DEFAULT 'DAY',
 ADD COLUMN IF NOT EXISTS proposal_review_date date,
 ADD COLUMN IF NOT EXISTS proposal_review_date_precision varchar(10) NOT NULL DEFAULT 'DAY',
 ADD COLUMN IF NOT EXISTS acceptance_date date,
 ADD COLUMN IF NOT EXISTS acceptance_date_precision varchar(10) NOT NULL DEFAULT 'DAY';
UPDATE research.research_projects p SET principal_investigator_name=COALESCE(NULLIF(BTRIM(p.principal_investigator_name),''),u.full_name), principal_investigator_email=COALESCE(NULLIF(BTRIM(p.principal_investigator_email),''),u.email) FROM auth.users u WHERE p.principal_investigator_id=u.user_id;
ALTER TABLE research.project_members ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE research.project_members
 ADD COLUMN IF NOT EXISTS member_name varchar(255), ADD COLUMN IF NOT EXISTS email varchar(255),
 ADD COLUMN IF NOT EXISTS department_id bigint, ADD COLUMN IF NOT EXISTS department_name_text varchar(255),
 ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS updated_at timestamptz(0),
 ADD COLUMN IF NOT EXISTS updated_by bigint, ADD COLUMN IF NOT EXISTS deleted_at timestamptz(0),
 ADD COLUMN IF NOT EXISTS deleted_by bigint, ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;
UPDATE research.project_members pm SET member_name=COALESCE(NULLIF(BTRIM(pm.member_name),''),u.full_name), email=COALESCE(NULLIF(BTRIM(pm.email),''),u.email), department_id=COALESCE(pm.department_id,u.department_id) FROM auth.users u WHERE pm.user_id=u.user_id;
UPDATE research.project_members pm SET department_name_text=COALESCE(NULLIF(BTRIM(pm.department_name_text),''),d.department_name) FROM ref.departments d WHERE pm.department_id=d.department_id;
ALTER TABLE research.project_milestones ADD COLUMN IF NOT EXISTS milestone_type varchar(100);
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='CK_project_members_identity' AND conrelid='research.project_members'::regclass) THEN ALTER TABLE research.project_members ADD CONSTRAINT "CK_project_members_identity" CHECK (user_id IS NOT NULL OR NULLIF(BTRIM(member_name),'') IS NOT NULL); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_project_members_department' AND conrelid='research.project_members'::regclass) THEN ALTER TABLE research.project_members ADD CONSTRAINT "FK_project_members_department" FOREIGN KEY(department_id) REFERENCES ref.departments(department_id); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_project_members_updated_by' AND conrelid='research.project_members'::regclass) THEN ALTER TABLE research.project_members ADD CONSTRAINT "FK_project_members_updated_by" FOREIGN KEY(updated_by) REFERENCES auth.users(user_id); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='FK_project_members_deleted_by' AND conrelid='research.project_members'::regclass) THEN ALTER TABLE research.project_members ADD CONSTRAINT "FK_project_members_deleted_by" FOREIGN KEY(deleted_by) REFERENCES auth.users(user_id); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='CK_research_projects_registration_precision' AND conrelid='research.research_projects'::regclass) THEN ALTER TABLE research.research_projects ADD CONSTRAINT "CK_research_projects_registration_precision" CHECK(registration_date_precision IN ('DAY','MONTH')); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='CK_research_projects_proposal_review_precision' AND conrelid='research.research_projects'::regclass) THEN ALTER TABLE research.research_projects ADD CONSTRAINT "CK_research_projects_proposal_review_precision" CHECK(proposal_review_date_precision IN ('DAY','MONTH')); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='CK_research_projects_acceptance_precision' AND conrelid='research.research_projects'::regclass) THEN ALTER TABLE research.research_projects ADD CONSTRAINT "CK_research_projects_acceptance_precision" CHECK(acceptance_date_precision IN ('DAY','MONTH')); END IF;
END $do$;
DROP INDEX IF EXISTS research."UQ_project_members_project_user_role";
CREATE UNIQUE INDEX IF NOT EXISTS "UX_project_members_project_user_active" ON research.project_members(project_id,user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "IX_project_members_project_active" ON research.project_members(project_id,is_active,sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "IX_project_milestones_project_type" ON research.project_milestones(project_id,milestone_type) WHERE deleted_at IS NULL;
""");

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive: these columns may pre-exist on Neon and contain production data.
    }
}
