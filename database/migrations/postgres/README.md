# PostgreSQL migrations

Add versioned SQL files using `{version}_{name}.up.sql` and matching `{version}_{name}.down.sql`.

The MCP module currently ships baseline DDL at `ddl/baseline/postgres/0001_mcp_baseline.sql`.

- `0002_mcp_server_allowed_role_codes` adds `ai_mcp_server.allowed_role_codes`, the
  IAM role-code assignment list (`[]` = every role, the default).
