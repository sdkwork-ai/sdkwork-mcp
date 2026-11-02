-- sdkwork:migration
-- id: 0002_mcp_server_allowed_role_codes
-- engine: postgres
-- module: sdkwork-mcp
-- purpose: Assign MCP servers to IAM roles. `allowed_role_codes` holds the
--   role codes allowed to see and use a server; an empty array (the default)
--   means every role, which keeps existing rows visible to all.
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE ai_mcp_server
    ADD COLUMN IF NOT EXISTS allowed_role_codes JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_ai_mcp_server_allowed_roles'
          AND conrelid = 'ai_mcp_server'::regclass
    ) THEN
        ALTER TABLE ai_mcp_server
            ADD CONSTRAINT ck_ai_mcp_server_allowed_roles
            CHECK (jsonb_typeof(allowed_role_codes) = 'array');
    END IF;
END
$$;

UPDATE ai_mcp_server
SET allowed_role_codes = '[]'::jsonb
WHERE allowed_role_codes IS NULL OR jsonb_typeof(allowed_role_codes) <> 'array';

CREATE INDEX IF NOT EXISTS idx_ai_mcp_server_allowed_roles
    ON ai_mcp_server USING GIN (allowed_role_codes)
    WHERE deleted_at IS NULL;

COMMIT;
