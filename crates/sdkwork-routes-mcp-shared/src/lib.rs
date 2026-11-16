//! Shared HTTP helpers and record builders for MCP route crates.

pub mod health;
pub mod http;
pub mod list_query;
pub mod record_builders;
mod response;
mod service_ops;

pub use health::{healthz_with_state, livez, readyz_with_state, DbReadinessCheck};
pub use http::{
    resolve_tenant_id, resolve_tenant_id_from_context, SharedMcpService, TENANT_HEADER,
};
pub use list_query::{McpInvocationListQuery, SdkWorkListQuery};
pub use response::{
    finish_api_json, item_data, ok_json, page_data, paginate_items, ApiProblem, ApiResult,
};
pub use service_ops::{
    append_invocation, delete_category, delete_connector, delete_prompt, delete_resource,
    delete_server, delete_tool, get_category, get_connector, get_prompt, get_resource, get_server,
    get_tool, list_catalog_categories, list_catalog_servers, list_categories, list_connectors,
    list_invocations, list_owned_servers, list_prompts, list_resources, list_servers, list_tools,
    upsert_category, upsert_connector, upsert_prompt, upsert_resource, upsert_server, upsert_tool,
};

pub fn gateway_mount() -> axum::Router {
    axum::Router::new()
}
