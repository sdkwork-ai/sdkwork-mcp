# Operator Guide

Deployment and health checks for **sdkwork-mcp**.

## Health endpoints

Both app and backend route surfaces expose:

| Route | Purpose |
| --- | --- |
| `/livez` | Process liveness |
| `/readyz` | Dependency readiness (PostgreSQL when configured) |
| `/healthz` | Alias of readyz |

Health probes return simple JSON (`{ "status": "ok" }`) and are exempt from business `SdkWorkApiResponse` envelopes.

## Runtime configuration

- Database profile: canonical workspace PostgreSQL `SDKWORK_DATABASE_*` (see `specs/topology.spec.json`)
- Gateway assembly: `crates/sdkwork-api-mcp-assembly`
- Standalone binary: `crates/sdkwork-api-mcp-standalone-gateway`

## Verification before release

```powershell
pnpm verify
pnpm topology:validate
pnpm db:validate
node ../sdkwork-specs/tools/check-api-response-envelope.mjs --workspace .
```

## Deployment assets

- Docker: `deployments/docker/Dockerfile`
- Workflow manifest: `agent.workflow.json`

See [../../architecture/tech/TECH_ARCHITECTURE.md](../../architecture/tech/TECH_ARCHITECTURE.md) for topology profiles.
