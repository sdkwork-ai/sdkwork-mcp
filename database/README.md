# SDKWork MCP Database

Contract version: **1.1.0**  
Module: `mcp` | Prefix: `ai_mcp_` | Engine: PostgreSQL

## Layout

| Path | Purpose |
| --- | --- |
| `contract/schema.yaml` | Portable schema contract (L2) |
| `contract/table-registry.json` | Table ownership and lifecycle |
| `contract/prefix-registry.json` | `ai_mcp_` module prefix |
| `ddl/baseline/postgres/0001_mcp_baseline.sql` | Greenfield baseline DDL |
| `seeds/common/001_bootstrap.sql` | Platform category seed (`tenant_id=0`) |
| `database.manifest.json` | Lifecycle SPI manifest |

SQLite baseline is intentionally omitted; MCP persistence is PostgreSQL-only.

## Active Tables

| Module | Table |
| --- | --- |
| Registry | `ai_mcp_server_category`, `ai_mcp_server` |
| Connector | `ai_mcp_connector` |
| Capability | `ai_mcp_tool`, `ai_mcp_resource`, `ai_mcp_prompt` |
| Observability | `ai_mcp_invocation_log` |

Planned (registry only): `ai_mcp_server_binding`, `ai_mcp_tool_approval`, `ai_mcp_capability_sync_job`.

## Role assignment

`ai_mcp_server.allowed_role_codes` is a JSONB array of IAM role codes allowed to
see and use the server. An empty array is the default and means every role.
Role codes follow `^[a-z][a-z0-9_.-]{0,127}$` and are stored normalized by the
application; a GIN index serves role-membership filtering.

## Bootstrap

```bash
pnpm db:validate
pnpm db:bootstrap   # or db:migrate + db:seed
pnpm db:drift:check
```

Runtime IDs are assigned by the application (`sdkwork-id-core` Snowflake + `sdkwork-utils-rust` UUID), not database sequences.

## Related Specs

- `../sdkwork-specs/DATABASE_SPEC.md`
- `../sdkwork-specs/DATABASE_FRAMEWORK_SPEC.md`
- `../docs/architecture/tech/TECH_ARCHITECTURE.md`

## Initialization state

This module is in **initialization state** for greenfield deployments:

1. **Baseline** — `database/ddl/baseline/{engine}/0001_mcp_baseline.sql` contains the full DDL snapshot.
2. **Migrations** — `database/migrations/{engine}/` is reserved for post-GA incremental schema changes only. It is intentionally empty at initialization.
3. **Drift** — run `pnpm db:drift:check` before release.

## Commands

```bash
pnpm run db:validate
pnpm run db:materialize:contract
pnpm run db:plan
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
```
