use std::sync::Arc;

mod handlers;
mod health;
pub mod http_route_manifest;
mod paths;
mod ports;
mod web_bootstrap;

use axum::{
    extract::{Extension, Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Response,
    routing::{delete, get, post},
    Json, Router,
};
use sdkwork_intelligence_mcp_service::McpService;
use sdkwork_mcp_contract::{
    McpAuthKind, McpLifecycleStatus, McpPublishStatus, McpServerRecord, McpTransportKind,
    McpVisibility,
};
use sdkwork_routes_mcp_shared::record_builders::{
    connector_record, server_record, EntityWriteContext,
};
use sdkwork_routes_mcp_shared::{
    delete_connector, delete_server, list_owned_servers, upsert_connector, upsert_server,
    ApiProblem,
};
use sdkwork_web_core::{HttpRouteManifest, WebRequestContext};
use serde::Deserialize;
use sqlx::PgPool;

pub use handlers::{
    finish_api_json, get_server, get_tool, list_categories, list_invocations, list_prompts,
    list_resources, list_servers, list_tools, ok_json, resolve_tenant_id, McpInvocationListQuery,
    SdkWorkListQuery, SharedMcpService,
};
pub use health::DbReadinessCheck;
pub use http_route_manifest::app_route_manifest;
pub use ports::McpAppRequestContext;
pub use web_bootstrap::{
    mcp_public_path_prefixes, wrap_router_with_web_framework,
    wrap_router_with_web_framework_from_env, McpAppContextInjector,
};

#[derive(Clone)]
pub struct AppState<R: sdkwork_intelligence_mcp_service::McpRepository> {
    pub service: SharedMcpService<R>,
    pub default_tenant_id: u64,
    pub readiness: Option<DbReadinessCheck>,
}

/// App-api self-service server creation. Visibility is forced to tenant; the
/// marketplace publication scope is admin-managed through the backend surface.
#[derive(Debug, Deserialize)]
struct CreateOwnServerRequest {
    server_key: String,
    name: String,
    description: Option<String>,
    transport: McpTransportKind,
    category_id: Option<u64>,
    category_code: Option<String>,
    tags: Vec<String>,
    icon_ref: Option<String>,
}

/// App-api self-service server update. Publication fields (visibility,
/// lifecycle_status) are admin-managed and intentionally absent.
#[derive(Debug, Deserialize)]
struct UpdateOwnServerRequest {
    name: Option<String>,
    description: Option<String>,
    transport: Option<McpTransportKind>,
    category_id: Option<u64>,
    category_code: Option<String>,
    tags: Option<Vec<String>>,
    icon_ref: Option<String>,
}

/// App-api self-service connector upsert. Publish/lifecycle status default to
/// draft/active and are not user-controllable.
#[derive(Debug, Deserialize)]
struct UpsertOwnConnectorRequest {
    connector_key: String,
    transport: McpTransportKind,
    endpoint_url: Option<String>,
    command_ref: Option<String>,
    args_json: Option<String>,
    env_schema_json: Option<String>,
    auth_type: Option<McpAuthKind>,
    secret_ref: Option<String>,
    timeout_ms: Option<u32>,
    retry_policy_json: Option<String>,
}

fn business_routes<R>() -> Router<AppState<R>>
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    Router::new()
        .route(paths::CATEGORIES_LIST, get(list_categories_handler))
        .route(
            paths::SERVERS_LIST,
            get(list_servers_handler).post(create_own_server_handler),
        )
        .route(paths::SERVERS_OWNED_LIST, get(list_owned_servers_handler))
        .route(
            paths::SERVER_GET,
            get(get_server_handler)
                .patch(update_own_server_handler)
                .delete(delete_own_server_handler),
        )
        .route(paths::SERVER_TOOLS_LIST, get(list_tools_handler))
        .route(paths::SERVER_TOOL_GET, get(get_tool_handler))
        .route(paths::SERVER_RESOURCES_LIST, get(list_resources_handler))
        .route(paths::SERVER_PROMPTS_LIST, get(list_prompts_handler))
        .route(
            paths::SERVER_CONNECTORS_UPSERT,
            post(upsert_own_connector_handler),
        )
        .route(
            paths::SERVER_CONNECTORS_DELETE,
            delete(delete_own_connector_handler),
        )
        .route(paths::INVOCATIONS_LIST, get(list_invocations_handler))
}

pub fn business_router<R>(state: AppState<R>) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    business_routes::<R>().with_state(state)
}

pub fn router<R>(state: AppState<R>) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    Router::new()
        .route(paths::LIVEZ, get(health::livez))
        .route(paths::READYZ, get(readyz_handler::<R>))
        .route(paths::HEALTHZ, get(healthz_handler::<R>))
        .merge(business_routes::<R>())
        .with_state(state)
}

async fn readyz_handler<R>(
    State(state): State<AppState<R>>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)>
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    health::readyz_with_state(state.readiness.clone()).await
}

async fn healthz_handler<R>(
    State(state): State<AppState<R>>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)>
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    health::healthz_with_state(state.readiness.clone()).await
}

fn resolve_request_tenant_id(
    ctx: &WebRequestContext,
    context: Option<&Extension<McpAppRequestContext>>,
    default_tenant_id: u64,
) -> u64 {
    if let Some(extension) = context {
        return extension.0.tenant_id;
    }
    sdkwork_routes_mcp_shared::resolve_tenant_id_from_context(ctx, default_tenant_id)
}

async fn list_categories_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Query(query): Query<SdkWorkListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_categories(state.service.as_ref(), tenant_id, &query).await?)
        }
        .await,
    )
}

async fn list_servers_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Query(query): Query<SdkWorkListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_servers(state.service.as_ref(), tenant_id, &query).await?)
        }
        .await,
    )
}

async fn get_server_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_key): Path<String>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(get_server(state.service.as_ref(), tenant_id, server_key.as_str()).await?)
        }
        .await,
    )
}

async fn list_tools_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_id): Path<u64>,
    Query(query): Query<SdkWorkListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_tools(state.service.as_ref(), tenant_id, server_id, &query).await?)
        }
        .await,
    )
}

async fn get_tool_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path((server_id, tool_key)): Path<(u64, String)>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(
                get_tool(
                    state.service.as_ref(),
                    tenant_id,
                    server_id,
                    tool_key.as_str(),
                )
                .await?,
            )
        }
        .await,
    )
}

async fn list_resources_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_id): Path<u64>,
    Query(query): Query<SdkWorkListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_resources(state.service.as_ref(), tenant_id, server_id, &query).await?)
        }
        .await,
    )
}

async fn list_prompts_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_id): Path<u64>,
    Query(query): Query<SdkWorkListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_prompts(state.service.as_ref(), tenant_id, server_id, &query).await?)
        }
        .await,
    )
}

async fn list_invocations_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Query(query): Query<McpInvocationListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_invocations(state.service.as_ref(), tenant_id, &query).await?)
        }
        .await,
    )
}

fn resolve_actor_id(context: Option<&Extension<McpAppRequestContext>>) -> Option<u64> {
    context.and_then(|extension| extension.0.actor_id)
}

fn require_actor_id(context: Option<&Extension<McpAppRequestContext>>) -> Result<u64, ApiProblem> {
    resolve_actor_id(context).ok_or_else(|| {
        ApiProblem::forbidden("mcp self-service requires an authenticated user principal")
    })
}

/// Self-service server ownership guard: only the authenticated creator may
/// mutate a server within the active tenant.
fn ensure_owned_server(
    context: Option<&Extension<McpAppRequestContext>>,
    record: &McpServerRecord,
) -> Result<(), ApiProblem> {
    let actor_id = require_actor_id(context)?;
    let tenant_id = context
        .map(|extension| extension.0.tenant_id)
        .unwrap_or_default();
    if record.tenant_id == tenant_id && record.owner_user_id == actor_id {
        Ok(())
    } else {
        Err(ApiProblem::forbidden(
            "mcp server is outside the authenticated user's ownership scope",
        ))
    }
}

async fn list_owned_servers_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Query(query): Query<SdkWorkListQuery>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let actor_id = require_actor_id(context.as_ref())?;
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            ok_json(list_owned_servers(state.service.as_ref(), tenant_id, actor_id, &query).await?)
        }
        .await,
    )
}

async fn create_own_server_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    context: Option<Extension<McpAppRequestContext>>,
    Json(body): Json<CreateOwnServerRequest>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let actor_id = require_actor_id(context.as_ref())?;
            let write_ctx = EntityWriteContext {
                tenant_id: resolve_request_tenant_id(
                    &ctx,
                    context.as_ref(),
                    state.default_tenant_id,
                ),
                operator_id: actor_id,
            };
            let mut record = server_record(
                write_ctx,
                actor_id,
                body.server_key,
                body.name,
                body.transport,
                McpVisibility::Tenant,
            );
            record.description = body.description;
            record.category_id = body.category_id;
            record.category_code = body.category_code;
            record.tags = body.tags;
            record.icon_ref = body.icon_ref;
            ok_json(upsert_server(state.service.as_ref(), record).await?)
        }
        .await,
    )
}

async fn update_own_server_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_key): Path<String>,
    context: Option<Extension<McpAppRequestContext>>,
    Json(body): Json<UpdateOwnServerRequest>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            let mut record = get_server(state.service.as_ref(), tenant_id, server_key.as_str())
                .await?
                .item;
            ensure_owned_server(context.as_ref(), &record)?;
            if let Some(value) = body.name {
                record.name = value;
            }
            if let Some(value) = body.description {
                record.description = Some(value);
            }
            if let Some(value) = body.transport {
                record.transport = value;
            }
            if let Some(value) = body.category_id {
                record.category_id = Some(value);
            }
            if let Some(value) = body.category_code {
                record.category_code = Some(value);
            }
            if let Some(value) = body.tags {
                record.tags = value;
            }
            if let Some(value) = body.icon_ref {
                record.icon_ref = Some(value);
            }
            ok_json(upsert_server(state.service.as_ref(), record).await?)
        }
        .await,
    )
}

async fn delete_own_server_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_key): Path<String>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            let record = get_server(state.service.as_ref(), tenant_id, server_key.as_str())
                .await?
                .item;
            ensure_owned_server(context.as_ref(), &record)?;
            ok_json(delete_server(state.service.as_ref(), tenant_id, server_key.as_str()).await?)
        }
        .await,
    )
}

async fn upsert_own_connector_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path(server_id): Path<u64>,
    context: Option<Extension<McpAppRequestContext>>,
    Json(body): Json<UpsertOwnConnectorRequest>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            let server = state
                .service
                .get_server_by_id(tenant_id, server_id)
                .await
                .map_err(ApiProblem::from)?;
            ensure_owned_server(context.as_ref(), &server)?;
            let actor_id = require_actor_id(context.as_ref())?;
            let write_ctx = EntityWriteContext {
                tenant_id,
                operator_id: actor_id,
            };
            let record = connector_record(
                write_ctx,
                server_id,
                body.connector_key,
                body.transport,
                body.endpoint_url,
                body.command_ref,
                body.args_json.unwrap_or_else(|| "[]".to_string()),
                body.env_schema_json.unwrap_or_else(|| "{}".to_string()),
                body.auth_type.unwrap_or(McpAuthKind::None),
                body.secret_ref,
                body.timeout_ms.unwrap_or(30_000),
                body.retry_policy_json.unwrap_or_else(|| "{}".to_string()),
                McpPublishStatus::Draft,
                McpLifecycleStatus::Active,
            );
            ok_json(upsert_connector(state.service.as_ref(), record).await?)
        }
        .await,
    )
}

async fn delete_own_connector_handler<R>(
    ctx: WebRequestContext,
    State(state): State<AppState<R>>,
    _headers: HeaderMap,
    Path((server_id, connector_key)): Path<(u64, String)>,
    context: Option<Extension<McpAppRequestContext>>,
) -> Response
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Send + Sync,
{
    finish_api_json(
        &ctx,
        async {
            let tenant_id =
                resolve_request_tenant_id(&ctx, context.as_ref(), state.default_tenant_id);
            let server = state
                .service
                .get_server_by_id(tenant_id, server_id)
                .await
                .map_err(ApiProblem::from)?;
            ensure_owned_server(context.as_ref(), &server)?;
            ok_json(
                delete_connector(
                    state.service.as_ref(),
                    tenant_id,
                    server_id,
                    connector_key.as_str(),
                )
                .await?,
            )
        }
        .await,
    )
}

pub fn build_router<R>(service: Arc<McpService<R>>, default_tenant_id: u64) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    router(AppState {
        service,
        default_tenant_id,
        readiness: None,
    })
}

pub fn build_router_with_readiness<R>(
    service: Arc<McpService<R>>,
    default_tenant_id: u64,
    pool: PgPool,
) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    router(AppState {
        service,
        default_tenant_id,
        readiness: Some(DbReadinessCheck::new(pool)),
    })
}

pub async fn build_router_with_web_framework_from_env<R>(
    service: Arc<McpService<R>>,
    default_tenant_id: u64,
    pool: PgPool,
) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    wrap_router_with_web_framework_from_env(build_router_with_readiness(
        service,
        default_tenant_id,
        pool,
    ))
    .await
}

pub fn gateway_route_manifest() -> HttpRouteManifest {
    app_route_manifest()
}

pub async fn gateway_mount_business<R>(
    service: Arc<McpService<R>>,
    default_tenant_id: u64,
) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    wrap_router_with_web_framework_from_env(business_router(AppState {
        service,
        default_tenant_id,
        readiness: None,
    }))
    .await
}

pub async fn gateway_mount<R>(
    service: Arc<McpService<R>>,
    default_tenant_id: u64,
    pool: PgPool,
) -> Router
where
    R: sdkwork_intelligence_mcp_service::McpRepository + Clone + Send + Sync + 'static,
{
    build_router_with_web_framework_from_env(service, default_tenant_id, pool).await
}
