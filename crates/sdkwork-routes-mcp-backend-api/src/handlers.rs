pub use sdkwork_routes_mcp_shared::record_builders::server_record as default_server_record;
pub use sdkwork_routes_mcp_shared::{
    append_invocation, delete_category, delete_connector, delete_prompt, delete_resource,
    delete_server, delete_tool, finish_api_json, get_category, get_connector, get_prompt,
    get_resource, get_server, get_tool, list_categories, list_connectors, list_invocations,
    list_servers, ok_json, resolve_tenant_id, upsert_category, upsert_connector, upsert_prompt,
    upsert_resource, upsert_server, upsert_tool, McpInvocationListQuery, SdkWorkListQuery,
    SharedMcpService,
};
