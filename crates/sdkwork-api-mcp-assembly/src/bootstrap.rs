//! Gateway bootstrap for sdkwork-mcp.
//! Multi-surface merges mount shared infrastructure routes once at the assembly layer.
//!
//! The assembly exports the indivisible `ApiAssemblyContribution` contract
//! (API_ASSEMBLY_SPEC.md section 4); the platform cloud gateway composes the
//! contribution with its process-shared PostgreSQL pool.

use sdkwork_web_bootstrap::WebModule;
use std::sync::Arc;

use axum::Router;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_intelligence_mcp_repository_sqlx::SqlxMcpRepository;
use sdkwork_intelligence_mcp_service::McpService;
use sdkwork_mcp_database_host::bootstrap_mcp_database;
use sdkwork_routes_mcp_app_api::DbReadinessCheck;
use sdkwork_web_bootstrap::ApiAssemblyContribution;
use sdkwork_web_core::HttpRouteManifest;
use sqlx::PgPool;

/// Indivisible host-neutral API assembly contribution (web-bootstrap contract).
pub type ApiAssembly = ApiAssemblyContribution;

struct McpRuntime {
    service: Arc<McpService<SqlxMcpRepository>>,
    default_tenant_id: u64,
    pool: PgPool,
}

impl McpRuntime {
    async fn bootstrap_from_database(pool: DatabasePool) -> Result<Self, String> {
        let host = bootstrap_mcp_database(pool).await?;
        let pool = host
            .postgres_pool()
            .ok_or_else(|| "mcp runtime requires postgres database pool".to_string())?
            .clone();
        let repository = SqlxMcpRepository::new(pool.clone());
        let service = Arc::new(McpService::new(repository));
        let default_tenant_id = std::env::var("SDKWORK_MCP_TENANT_ID")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(100_001);
        Ok(Self {
            service,
            default_tenant_id,
            pool,
        })
    }

    async fn bootstrap_from_env() -> Result<Self, String> {
        let host = sdkwork_mcp_database_host::bootstrap_mcp_database_from_env().await?;
        let pool = host
            .postgres_pool()
            .ok_or_else(|| "mcp runtime requires postgres database pool".to_string())?
            .clone();
        let repository = SqlxMcpRepository::new(pool.clone());
        let service = Arc::new(McpService::new(repository));
        let default_tenant_id = std::env::var("SDKWORK_MCP_TENANT_ID")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(100_001);
        Ok(Self {
            service,
            default_tenant_id,
            pool,
        })
    }
}

fn combined_route_manifest() -> HttpRouteManifest {
    let routes = sdkwork_routes_mcp_app_api::gateway_route_manifest()
        .routes()
        .iter()
        .chain(sdkwork_routes_mcp_backend_api::gateway_route_manifest().routes())
        .copied()
        .collect();
    HttpRouteManifest::from_owned_routes(routes)
}

async fn assemble_api_router_from_runtime(runtime: McpRuntime) -> Result<ApiAssembly, String> {
    let service = runtime.service.clone();
    let tenant_id = runtime.default_tenant_id;
    let pool = runtime.pool.clone();

    let app_router =
        sdkwork_routes_mcp_app_api::business_router(sdkwork_routes_mcp_app_api::AppState {
            service: service.clone(),
            default_tenant_id: tenant_id,
            readiness: None,
        });
    let backend_router = sdkwork_routes_mcp_backend_api::business_router(
        sdkwork_routes_mcp_backend_api::BackendState {
            service,
            default_tenant_id: tenant_id,
            readiness: None,
        },
    );
    let router = Router::new().merge(app_router).merge(backend_router);
    ApiAssemblyContribution::from_manifest(
        "sdkwork-mcp",
        "SDKWork MCP API",
        router,
        combined_route_manifest(),
        vec![
            Arc::new(sdkwork_routes_mcp_app_api::McpAppContextInjector),
            Arc::new(sdkwork_routes_mcp_backend_api::McpBackendContextInjector),
        ],
        Arc::new(DbReadinessCheck::new(pool)),
    )
}

pub async fn assemble_api_router() -> Result<ApiAssembly, String> {
    let runtime = McpRuntime::bootstrap_from_env().await?;
    assemble_api_router_from_runtime(runtime).await
}

/// Assemble the MCP contribution against a caller-provided database pool so the
/// platform cloud gateway can share its process-wide PostgreSQL pool.
pub async fn assemble_api_router_with_pool(pool: DatabasePool) -> Result<ApiAssembly, String> {
    let runtime = McpRuntime::bootstrap_from_database(pool).await?;
    assemble_api_router_from_runtime(runtime).await
}

/// Runs the MCP-owned database lifecycle without constructing HTTP routes.
pub async fn bootstrap_database_from_env() -> Result<(), String> {
    sdkwork_mcp_database_host::bootstrap_mcp_database_from_env()
        .await
        .map(|_| ())
}

/// Builds the MCP App API as a composing-owner contribution. The returned
/// router carries only business routes; the composing gateway supplies the
/// web framework layer, domain context injection, and readiness aggregation.
pub async fn assemble_app_api_contribution() -> Result<ApiAssemblyContribution, String> {
    let runtime = McpRuntime::bootstrap_from_env().await?;
    let service = runtime.service.clone();
    let tenant_id = runtime.default_tenant_id;
    let pool = runtime.pool.clone();

    let route_manifest = sdkwork_routes_mcp_app_api::app_route_manifest();
    let router =
        sdkwork_routes_mcp_app_api::business_router(sdkwork_routes_mcp_app_api::AppState {
            service,
            default_tenant_id: tenant_id,
            readiness: None,
        });
    ApiAssemblyContribution::from_manifest(
        "sdkwork-mcp",
        "SDKWork MCP App API",
        router,
        route_manifest,
        vec![Arc::new(sdkwork_routes_mcp_app_api::McpAppContextInjector)],
        Arc::new(DbReadinessCheck::new(pool)),
    )
}

/// Builds the MCP Backend API as a composing-owner contribution.
pub async fn assemble_backend_api_contribution() -> Result<ApiAssemblyContribution, String> {
    let runtime = McpRuntime::bootstrap_from_env().await?;
    let service = runtime.service.clone();
    let tenant_id = runtime.default_tenant_id;
    let pool = runtime.pool.clone();

    let route_manifest = sdkwork_routes_mcp_backend_api::backend_route_manifest();
    let router = sdkwork_routes_mcp_backend_api::business_router(
        sdkwork_routes_mcp_backend_api::BackendState {
            service,
            default_tenant_id: tenant_id,
            readiness: None,
        },
    );
    ApiAssemblyContribution::from_manifest(
        "sdkwork-mcp",
        "SDKWork MCP Backend API",
        router,
        route_manifest,
        vec![Arc::new(
            sdkwork_routes_mcp_backend_api::McpBackendContextInjector,
        )],
        Arc::new(DbReadinessCheck::new(pool)),
    )
}

/// Canonical Web Module definition for this application
/// (API_ASSEMBLY_SPEC §4.1.1): the complete HTTP surface — every route,
/// manifest, and OpenAPI document of this owner — as one installable module.
pub async fn web_module() -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router().await?))
}

/// Same as [`web_module`] but composed on a process-shared database pool
/// (platform gateways, API_ASSEMBLY_SPEC §4.1.1).
pub async fn web_module_with_pool(pool: DatabasePool) -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router_with_pool(pool).await?))
}
