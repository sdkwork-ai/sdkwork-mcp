use std::path::PathBuf;
use std::sync::Arc;

use sdkwork_database_config::DatabaseConfig;
use sdkwork_database_drift::DriftEngine;
use sdkwork_database_lifecycle::{lifecycle_options_from_env, LifecycleOrchestrator};
use sdkwork_database_spi::{DatabaseAssetProvider, DatabaseManifest, DefaultDatabaseModule};
use sdkwork_database_sqlx::{create_pool_from_config, DatabasePool};

pub const MODULE_ID: &str = "mcp";

pub struct McpDatabaseHost {
    pool: DatabasePool,
    module: Arc<DefaultDatabaseModule>,
}

impl McpDatabaseHost {
    pub fn pool(&self) -> &DatabasePool {
        &self.pool
    }

    pub fn postgres_pool(&self) -> Option<sqlx::PgPool> {
        self.pool.as_postgres().cloned()
    }

    pub fn module(&self) -> Arc<DefaultDatabaseModule> {
        self.module.clone()
    }
}

pub async fn bootstrap_mcp_database(pool: DatabasePool) -> Result<McpDatabaseHost, String> {
    let app_root = resolve_app_root();
    let module = Arc::new(
        DefaultDatabaseModule::from_app_root(&app_root)
            .map_err(|error| format!("load mcp database module failed: {error}"))?,
    );
    let manifest = DatabaseManifest::from_file(module.manifest_path())
        .map_err(|error| format!("read mcp database manifest failed: {error}"))?;
    let options = lifecycle_options_from_env("MCP", &manifest);
    let orchestrator =
        LifecycleOrchestrator::new(pool.clone(), module.clone()).with_applied_by("sdkwork-mcp");

    orchestrator
        .init()
        .await
        .map_err(|error| format!("mcp database init failed: {error}"))?;

    if options.auto_migrate {
        orchestrator
            .migrate()
            .await
            .map_err(|error| format!("mcp database migrate failed: {error}"))?;
    }

    // DATABASE_SPEC §35: readiness must fail when required migrations are
    // missing or the schema drifts from the contract. Drift is observation only
    // (DATABASE_FRAMEWORK_SPEC §4.2); repair runs `db:migrate`. The mcp module is
    // composed same-origin by the standalone gateway, so a drift here would
    // otherwise surface as a request-time error against a surface the
    // composition layer already declared as served (DATABASE_FRAMEWORK_SPEC
    // §4.4.1).
    let drift = DriftEngine::new(pool.clone(), module.clone())
        .analyze()
        .await
        .map_err(|error| format!("mcp database drift check failed: {error}"))?;
    if drift.summary.error > 0 {
        let details = drift
            .diffs
            .iter()
            .filter(|diff| diff.severity == "error")
            .take(5)
            .map(|diff| diff.message.as_str())
            .collect::<Vec<_>>()
            .join("; ");
        return Err(format!(
            "mcp database schema drift detected ({} error(s)): {details}. Run `pnpm db:migrate` and then `pnpm db:drift:check`",
            drift.summary.error
        ));
    }

    Ok(McpDatabaseHost { pool, module })
}

pub async fn bootstrap_mcp_database_from_env() -> Result<McpDatabaseHost, String> {
    let _ = dotenvy::dotenv();
    let config = DatabaseConfig::from_env("MCP")
        .map_err(|error| format!("read mcp database config failed: {error}"))?;
    let pool = create_pool_from_config(config)
        .await
        .map_err(|error| format!("create mcp database pool failed: {error}"))?;
    bootstrap_mcp_database(pool).await
}

fn resolve_app_root() -> PathBuf {
    std::env::var("SDKWORK_MCP_APP_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../..")
                .canonicalize()
                .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
        })
}
