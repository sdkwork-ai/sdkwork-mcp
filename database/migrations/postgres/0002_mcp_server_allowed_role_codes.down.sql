-- sdkwork:migration
-- id: 0002_mcp_server_allowed_role_codes
-- engine: postgres
-- module: sdkwork-mcp
-- purpose: Preserve MCP server role-assignment data on reversal. Dropping the
--   allowed_role_codes column would destroy every tenant's server visibility
--   policy, so this down migration deliberately performs no DDL.
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

-- Intentionally no-op: allowed_role_codes and its index/constraint are retained.
SELECT 1;

COMMIT;
