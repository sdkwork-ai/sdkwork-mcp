# MCP Runbooks

Operational procedures for **sdkwork-mcp** before and after production launch.

## Pre-launch checklist

1. **Contracts and SDKs**
   - `pnpm api:materialize` and `pnpm sdk:generate:check` pass
   - `node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .` passes

2. **Persistence**
   - Apply `database/ddl/baseline/postgres/0001_mcp_baseline.sql` (or managed migrations) to target PostgreSQL
   - Set the canonical workspace PostgreSQL `SDKWORK_DATABASE_*` profile per `specs/topology.spec.json`
   - `pnpm db:validate` passes

3. **Gateway**
   - Build/deploy `crates/sdkwork-api-mcp-standalone-gateway` or Docker image from `deployments/docker/Dockerfile`
   - Confirm `/livez` and `/readyz` on both app and backend surfaces

4. **IAM**
   - Bind roles from `specs/mcp-admin.permissions.json` in platform IAM before enabling PC admin
   - Verify tenant headers (`x-sdkwork-tenant-id`) for controlled admin overrides only

5. **Clients**
   - PC admin icon uploads use `@sdkwork/drive-app-sdk`; persisted `icon_ref` values are `drive://` URIs only
   - H5 and Flutter are browse-only (no drive upload until mobile admin surfaces exist)

6. **Workspace**
   - `pnpm verify` passes from repository root
   - `node ../sdkwork-specs/tools/sync-workspace.mjs --repo sdkwork-mcp --root .` when workspace registry drifts

## Smoke test (standalone)

```powershell
pnpm verify
# Start gateway with SDKWORK_DATABASE_* set, then:
# GET /app/v3/api/mcp/servers?page_size=5
# GET /backend/v3/api/mcp/categories?page_size=5  (authenticated admin)
```

Success list responses must include `code: 0`, `data.items`, `data.pageInfo`, and `traceId`.

## Incident response

| Symptom | Check |
| --- | --- |
| `readyz` fails | PostgreSQL connectivity, `SDKWORK_DATABASE_*`, pool limits |
| Empty marketplace | Tenant filter, server `lifecycle_status`, visibility / `data_scope` |
| Admin 403 | IAM permission binding for `mcp.admin.*` codes |
| Icon rejected on save | `icon_ref` must validate via `sdkwork-drive-contract` (`drive://spaces/.../nodes/...`) |

## Related docs

- [../guides/operator/README.md](../guides/operator/README.md) — health endpoints and deployment assets
- [../architecture/tech/TECH_ARCHITECTURE.md](../architecture/tech/TECH_ARCHITECTURE.md) — system topology
- [../guides/integrator/README.md](../guides/integrator/README.md) — API envelope and list query parameters


<!-- scaffold-module-runbooks:index -->
## Docker 运维四件套（bin/ 标准，OPERATIONS_SPEC.md §7）

| Runbook | 内容 |
| --- | --- |
| [deploy.md](deploy.md) / [deploy.en.md](deploy.en.md) | 安装 / 升级 / 回滚 / 下线（bin/docker-deploy.sh + bin/docker-image.sh） |
| [troubleshooting.md](troubleshooting.md) / [troubleshooting.en.md](troubleshooting.en.md) | 症状 → doctor 检查 → 处置 |
| [backup-restore.md](backup-restore.md) / [backup-restore.en.md](backup-restore.en.md) | 备份 / 校验 / 恢复 / 演练（bin/backup.sh） |
| [log-reference.md](log-reference.md) / [log-reference.en.md](log-reference.en.md) | 健康日志特征与失败签名（bin/docker-deploy.sh logs） |
