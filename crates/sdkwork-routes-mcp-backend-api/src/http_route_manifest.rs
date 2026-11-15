use sdkwork_mcp_contract::{
    PERM_ADMIN_CATEGORY_MANAGE, PERM_ADMIN_INVOCATION_READ, PERM_ADMIN_MARKETPLACE_READ,
    PERM_ADMIN_SERVER_MANAGE,
};
use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest, RateLimitTier};

const fn admin_route(
    method: HttpMethod,
    path: &'static str,
    operation_id: &'static str,
    permission: &'static str,
) -> HttpRoute {
    HttpRoute::dual_token(method, path, "mcp-admin", operation_id)
        .with_required_permission(permission)
}

const fn abuse_sensitive_admin_route(
    method: HttpMethod,
    path: &'static str,
    operation_id: &'static str,
    permission: &'static str,
) -> HttpRoute {
    HttpRoute::dual_token(method, path, "mcp-admin", operation_id)
        .with_rate_limit_tier(RateLimitTier::AuthCritical)
        .with_required_permission(permission)
}

const HTTP_ROUTES: &[HttpRoute] = &[
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/categories",
        "mcpAdmin.listCategories",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/categories",
        "mcpAdmin.upsertCategory",
        PERM_ADMIN_CATEGORY_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/categories/{categoryCode}",
        "mcpAdmin.getCategory",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Delete,
        "/backend/v3/api/mcp/categories/{categoryCode}",
        "mcpAdmin.deleteCategory",
        PERM_ADMIN_CATEGORY_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/servers",
        "mcpAdmin.listServers",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/servers",
        "mcpAdmin.createServer",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Put,
        "/backend/v3/api/mcp/servers/{serverKey}",
        "mcpAdmin.updateServer",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Delete,
        "/backend/v3/api/mcp/servers/{serverKey}",
        "mcpAdmin.deleteServer",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/servers/{serverId}/connectors",
        "mcpAdmin.listConnectors",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/servers/{serverId}/connectors",
        "mcpAdmin.upsertConnector",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/servers/{serverId}/connectors/{connectorKey}",
        "mcpAdmin.getConnector",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Delete,
        "/backend/v3/api/mcp/servers/{serverId}/connectors/{connectorKey}",
        "mcpAdmin.deleteConnector",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/servers/{serverId}/tools",
        "mcpAdmin.upsertTool",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/servers/{serverId}/tools/{toolKey}",
        "mcpAdmin.getTool",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Delete,
        "/backend/v3/api/mcp/servers/{serverId}/tools/{toolKey}",
        "mcpAdmin.deleteTool",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/servers/{serverId}/resources",
        "mcpAdmin.upsertResource",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/servers/{serverId}/resources/{resourceKey}",
        "mcpAdmin.getResource",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Delete,
        "/backend/v3/api/mcp/servers/{serverId}/resources/{resourceKey}",
        "mcpAdmin.deleteResource",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/servers/{serverId}/prompts",
        "mcpAdmin.upsertPrompt",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/servers/{serverId}/prompts/{promptKey}",
        "mcpAdmin.getPrompt",
        PERM_ADMIN_MARKETPLACE_READ,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Delete,
        "/backend/v3/api/mcp/servers/{serverId}/prompts/{promptKey}",
        "mcpAdmin.deletePrompt",
        PERM_ADMIN_SERVER_MANAGE,
    ),
    admin_route(
        HttpMethod::Get,
        "/backend/v3/api/mcp/invocations",
        "mcpAdmin.listInvocations",
        PERM_ADMIN_INVOCATION_READ,
    ),
    abuse_sensitive_admin_route(
        HttpMethod::Post,
        "/backend/v3/api/mcp/invocations",
        "mcpAdmin.appendInvocation",
        PERM_ADMIN_INVOCATION_READ,
    ),
];

pub fn backend_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(HTTP_ROUTES)
}
