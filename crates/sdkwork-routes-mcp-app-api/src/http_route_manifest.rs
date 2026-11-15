use sdkwork_mcp_contract::{
    PERM_CONNECTORS_CREATE, PERM_CONNECTORS_DELETE, PERM_INVOCATIONS_READ, PERM_MARKETPLACE_READ,
    PERM_SERVERS_CREATE, PERM_SERVERS_DELETE, PERM_SERVERS_UPDATE,
};
use sdkwork_web_core::{HttpMethod, HttpRoute, HttpRouteManifest};

const fn mcp_route(
    method: HttpMethod,
    path: &'static str,
    operation_id: &'static str,
    permission: &'static str,
) -> HttpRoute {
    HttpRoute::dual_token(method, path, "mcp", operation_id).with_required_permission(permission)
}

const HTTP_ROUTES: &[HttpRoute] = &[
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/categories",
        "mcp.listCategories",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers",
        "mcp.listServers",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Post,
        "/app/v3/api/mcp/servers",
        "mcp.createOwnServer",
        PERM_SERVERS_CREATE,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/owned",
        "mcp.listOwnedServers",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverKey}",
        "mcp.getServer",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Patch,
        "/app/v3/api/mcp/servers/{serverKey}",
        "mcp.updateOwnServer",
        PERM_SERVERS_UPDATE,
    ),
    mcp_route(
        HttpMethod::Delete,
        "/app/v3/api/mcp/servers/{serverKey}",
        "mcp.deleteOwnServer",
        PERM_SERVERS_DELETE,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverId}/tools",
        "mcp.listTools",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverId}/tools/{toolKey}",
        "mcp.getTool",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverId}/resources",
        "mcp.listResources",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverId}/resources/{resourceKey}",
        "mcp.getResource",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverId}/prompts",
        "mcp.listPrompts",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/servers/{serverId}/prompts/{promptKey}",
        "mcp.getPrompt",
        PERM_MARKETPLACE_READ,
    ),
    mcp_route(
        HttpMethod::Post,
        "/app/v3/api/mcp/servers/{serverId}/connectors",
        "mcp.upsertOwnConnector",
        PERM_CONNECTORS_CREATE,
    ),
    mcp_route(
        HttpMethod::Delete,
        "/app/v3/api/mcp/servers/{serverId}/connectors/{connectorKey}",
        "mcp.deleteOwnConnector",
        PERM_CONNECTORS_DELETE,
    ),
    mcp_route(
        HttpMethod::Get,
        "/app/v3/api/mcp/invocations",
        "mcp.listInvocations",
        PERM_INVOCATIONS_READ,
    ),
];

pub fn app_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(HTTP_ROUTES)
}
