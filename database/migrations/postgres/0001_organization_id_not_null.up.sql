-- sdkwork:migration
-- id: 0001_organization_id_not_null
-- engine: postgres
-- module: sdkwork-mcp
-- purpose: Enforce organization_id NOT NULL DEFAULT on all tables in the
--   consolidated baseline. NULL rows (pre-standard data anomalies) are
--   backfilled with the platform sentinel before NOT NULL is set, and
--   NOT NULL columns without an explicit default receive the sentinel
--   default, keeping existing deployments consistent with fresh baseline
--   installs.
-- reversible: false
-- rollback: forward-fix (sentinel backfill is the canonical fix; NULL
--   organization rows are data anomalies)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE ai_mcp_server_category ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_server_category SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_server_category ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_server_category ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ai_mcp_server ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_server SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_server ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_server ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ai_mcp_connector ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_connector SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_connector ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_connector ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ai_mcp_tool ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_tool SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_tool ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_tool ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ai_mcp_resource ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_resource SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_resource ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_resource ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ai_mcp_prompt ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_prompt SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_prompt ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_prompt ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE ai_mcp_invocation_log ADD COLUMN IF NOT EXISTS organization_id BIGINT NOT NULL DEFAULT 0;
UPDATE ai_mcp_invocation_log SET organization_id = 0 WHERE organization_id IS NULL;
ALTER TABLE ai_mcp_invocation_log ALTER COLUMN organization_id SET DEFAULT 0;
ALTER TABLE ai_mcp_invocation_log ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
