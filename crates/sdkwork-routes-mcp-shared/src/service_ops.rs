use sdkwork_intelligence_mcp_service::{McpRepository, McpService, McpServiceError};
use sdkwork_mcp_contract::{
    McpConnectorRecord, McpInvocationRecord, McpLifecycleStatus, McpPromptRecord,
    McpResourceRecord, McpServerCategoryRecord, McpServerRecord, McpToolRecord,
};
use sdkwork_utils_rust::{SdkWorkPageData, SdkWorkResourceData};

use crate::list_query::{McpInvocationListQuery, SdkWorkListQuery};
use crate::response::{item_data, page_data_from_total, paginate_items, ApiProblem, ApiResult};

impl From<McpServiceError> for ApiProblem {
    fn from(error: McpServiceError) -> Self {
        match error {
            McpServiceError::NotFound(message) => ApiProblem::not_found(message),
            McpServiceError::InvalidArgument(message) => ApiProblem::bad_request(message),
            McpServiceError::Repository(message) => ApiProblem::internal_server_error(message),
        }
    }
}

/// Page window for the store-level catalog list queries.
fn page_bounds(query: &SdkWorkListQuery) -> (i64, i64) {
    let limit = i64::from(query.effective_page_size());
    let page = i64::from(query.effective_page());
    (limit, (page - 1) * limit)
}

fn filter_by_keyword<T, F>(items: Vec<T>, query: &SdkWorkListQuery, matches: F) -> Vec<T>
where
    F: Fn(&T, &str) -> bool,
{
    let Some(keyword) = query.search_keyword() else {
        return items;
    };
    let keyword = keyword.to_lowercase();
    items
        .into_iter()
        .filter(|item| matches(item, keyword.as_str()))
        .collect()
}

fn filter_servers(items: Vec<McpServerRecord>, query: &SdkWorkListQuery) -> Vec<McpServerRecord> {
    filter_by_keyword(items, query, |item, keyword| {
        item.name.to_lowercase().contains(keyword)
            || item.server_key.to_lowercase().contains(keyword)
            || item
                .description
                .as_deref()
                .unwrap_or("")
                .to_lowercase()
                .contains(keyword)
            || item
                .category_code
                .as_deref()
                .unwrap_or("")
                .to_lowercase()
                .contains(keyword)
            || item
                .tags
                .iter()
                .any(|tag| tag.to_lowercase().contains(keyword))
    })
}

fn filter_connectors(
    items: Vec<McpConnectorRecord>,
    query: &SdkWorkListQuery,
) -> Vec<McpConnectorRecord> {
    filter_by_keyword(items, query, |item, keyword| {
        item.connector_key.to_lowercase().contains(keyword)
    })
}

fn filter_tools(items: Vec<McpToolRecord>, query: &SdkWorkListQuery) -> Vec<McpToolRecord> {
    filter_by_keyword(items, query, |item, keyword| {
        item.name.to_lowercase().contains(keyword) || item.tool_key.to_lowercase().contains(keyword)
    })
}

fn filter_resources(
    items: Vec<McpResourceRecord>,
    query: &SdkWorkListQuery,
) -> Vec<McpResourceRecord> {
    filter_by_keyword(items, query, |item, keyword| {
        item.name.to_lowercase().contains(keyword)
            || item.resource_key.to_lowercase().contains(keyword)
    })
}

fn filter_prompts(items: Vec<McpPromptRecord>, query: &SdkWorkListQuery) -> Vec<McpPromptRecord> {
    filter_by_keyword(items, query, |item, keyword| {
        item.name.to_lowercase().contains(keyword)
            || item.prompt_key.to_lowercase().contains(keyword)
    })
}

pub async fn list_categories<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpServerCategoryRecord>> {
    query.validate()?;
    let filter = query.catalog_filter();
    let (limit, offset) = page_bounds(query);
    let (items, total) = service
        .list_categories_page(tenant_id, &filter, query.search_keyword(), limit, offset)
        .await?;
    Ok(page_data_from_total(items, total, query))
}

/// Application catalog category listing: only catalog-visible categories
/// (`lifecycle_status = active`, not soft-deleted), so the marketplace never
/// offers a chip that files nothing.
pub async fn list_catalog_categories<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpServerCategoryRecord>> {
    query.validate()?;
    let filter = query.catalog_filter();
    let (limit, offset) = page_bounds(query);
    let (items, total) = service
        .list_catalog_categories_page(tenant_id, &filter, query.search_keyword(), limit, offset)
        .await?;
    Ok(page_data_from_total(items, total, query))
}

fn catalog_server_not_found(server_key: &str) -> ApiProblem {
    ApiProblem::not_found(format!("MCP server {server_key} is not published"))
}

/// Caller visibility scope for app-facing catalog reads: the organization and
/// user id that select the `organization` and `private` lanes of a server.
///
/// Admin/backend surfaces pass `None` where a shared operation accepts one, so
/// they keep reading every tenant row; the app surface always builds a scope
/// from the request principal.
#[derive(Debug, Clone, Copy)]
pub struct CatalogScope {
    organization_id: u64,
    user_id: u64,
}

impl CatalogScope {
    pub fn new(organization_id: u64, user_id: u64) -> Self {
        Self {
            organization_id,
            user_id,
        }
    }
}

/// Fail-closed decision for an app-facing sub-resource read: unless the parent
/// server is catalog-visible to the caller, the child read is reported with the
/// same `404` vocabulary as an unknown server, so a known `server_id` of a
/// private or other-organization server does not expose its tools, resources,
/// prompts or invocations.
fn sub_resource_scope(server_visible: bool) -> Result<(), ApiProblem> {
    if server_visible {
        Ok(())
    } else {
        Err(ApiProblem::not_found("MCP server is not published"))
    }
}

/// Asserts that the parent server of an app-facing sub-resource read is
/// catalog-visible to the caller.
///
/// `None` keeps an admin surface unscoped: the shared operations are also used
/// by the backend routes, which must still read drafts and every visibility
/// lane. `Some(scope)` is the fail-closed application path.
async fn ensure_sub_resource_server_visible<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: Option<CatalogScope>,
) -> ApiResult<()> {
    let Some(scope) = scope else {
        return Ok(());
    };
    let server_visible = service
        .catalog_server_exists(tenant_id, scope.organization_id, scope.user_id, server_id)
        .await?;
    sub_resource_scope(server_visible)
}

/// Application catalog retrieval: a server the marketplace list would not
/// publish or expose to this caller must not be readable by key either, so a
/// draft, a disabled row or another scope's row stays hidden instead of
/// leaking through a guessed `server_key`.
pub async fn get_catalog_server<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    organization_id: u64,
    user_id: u64,
    server_key: &str,
) -> ApiResult<SdkWorkResourceData<McpServerRecord>> {
    let record = service
        .get_catalog_server(tenant_id, organization_id, user_id, server_key)
        .await?
        .ok_or_else(|| catalog_server_not_found(server_key))?;
    // The store already applies the catalog lifecycle gate and the visibility
    // scope; this check keeps the active-only contract at the boundary too.
    if !catalog_visible_server(&record) {
        return Err(catalog_server_not_found(server_key));
    }
    Ok(item_data(record))
}

/// True when a stored server is part of the application catalog.
///
/// Mirrors the repository's `CATALOG_VISIBLE_FILTER` (`lifecycle_status = active`
/// and not soft-deleted); the repository already excludes soft-deleted rows
/// from every read, so only the lifecycle half is left to check here.
pub fn catalog_visible_server(record: &McpServerRecord) -> bool {
    record.lifecycle_status == McpLifecycleStatus::Active
}

/// Admin inventory listing: every non-deleted server, including drafts and
/// disabled rows, narrowed by the catalog view filters and the keyword.
pub async fn list_servers<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpServerRecord>> {
    query.validate()?;
    let filter = query.catalog_filter();
    let (limit, offset) = page_bounds(query);
    let (items, total) = service
        .list_servers_page(tenant_id, &filter, query.search_keyword(), limit, offset)
        .await?;
    Ok(page_data_from_total(items, total, query))
}

/// Application catalog listing: only catalog-visible servers
/// (`lifecycle_status = active`, not soft-deleted) within the caller's
/// visibility scope, narrowed by the catalog view filters and the keyword.
pub async fn list_catalog_servers<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    organization_id: u64,
    user_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpServerRecord>> {
    query.validate()?;
    let filter = query.catalog_filter();
    let (limit, offset) = page_bounds(query);
    let (items, total) = service
        .list_catalog_servers_page(
            tenant_id,
            organization_id,
            user_id,
            &filter,
            query.search_keyword(),
            limit,
            offset,
        )
        .await?;
    Ok(page_data_from_total(items, total, query))
}

pub async fn list_owned_servers<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    owner_user_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpServerRecord>> {
    query.validate()?;
    let items = service.list_owned_servers(tenant_id, owner_user_id).await?;
    Ok(paginate_items(filter_servers(items, query), query))
}

pub async fn get_server<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_key: &str,
) -> ApiResult<SdkWorkResourceData<McpServerRecord>> {
    let record = service.get_server(tenant_id, server_key).await?;
    Ok(item_data(record))
}

pub async fn list_connectors<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpConnectorRecord>> {
    query.validate()?;
    let items = service.list_connectors(tenant_id, server_id).await?;
    Ok(paginate_items(filter_connectors(items, query), query))
}

/// Application tool listing for one server. The parent server must be
/// catalog-visible to the caller first: a known but hidden `server_id` is
/// reported as not found instead of listing its tools.
pub async fn list_tools<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: CatalogScope,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpToolRecord>> {
    ensure_sub_resource_server_visible(service, tenant_id, server_id, Some(scope)).await?;
    query.validate()?;
    let items = service.list_tools(tenant_id, server_id).await?;
    Ok(paginate_items(filter_tools(items, query), query))
}

/// Shared tool retrieval. The app surface passes the caller scope and gets a
/// `404` when the parent server is not catalog-visible; the backend passes
/// `None` and keeps its unscoped admin behaviour.
pub async fn get_tool<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: Option<CatalogScope>,
    tool_key: &str,
) -> ApiResult<SdkWorkResourceData<McpToolRecord>> {
    ensure_sub_resource_server_visible(service, tenant_id, server_id, scope).await?;
    let record = service.get_tool(tenant_id, server_id, tool_key).await?;
    Ok(item_data(record))
}

pub async fn get_category<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    category_code: &str,
) -> ApiResult<SdkWorkResourceData<McpServerCategoryRecord>> {
    let record = service.get_category(tenant_id, category_code).await?;
    Ok(item_data(record))
}

pub async fn get_connector<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    connector_key: &str,
) -> ApiResult<SdkWorkResourceData<McpConnectorRecord>> {
    let record = service
        .get_connector(tenant_id, server_id, connector_key)
        .await?;
    Ok(item_data(record))
}

/// Shared resource retrieval, guarded by the parent server's catalog scope on
/// the application surface and unscoped (`None`) for the backend.
pub async fn get_resource<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: Option<CatalogScope>,
    resource_key: &str,
) -> ApiResult<SdkWorkResourceData<McpResourceRecord>> {
    ensure_sub_resource_server_visible(service, tenant_id, server_id, scope).await?;
    let record = service
        .get_resource(tenant_id, server_id, resource_key)
        .await?;
    Ok(item_data(record))
}

/// Shared prompt retrieval, guarded by the parent server's catalog scope on the
/// application surface and unscoped (`None`) for the backend.
pub async fn get_prompt<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: Option<CatalogScope>,
    prompt_key: &str,
) -> ApiResult<SdkWorkResourceData<McpPromptRecord>> {
    ensure_sub_resource_server_visible(service, tenant_id, server_id, scope).await?;
    let record = service.get_prompt(tenant_id, server_id, prompt_key).await?;
    Ok(item_data(record))
}

/// Application resource listing for one server, guarded by the parent server's
/// catalog scope.
pub async fn list_resources<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: CatalogScope,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpResourceRecord>> {
    ensure_sub_resource_server_visible(service, tenant_id, server_id, Some(scope)).await?;
    query.validate()?;
    let items = service.list_resources(tenant_id, server_id).await?;
    Ok(paginate_items(filter_resources(items, query), query))
}

/// Application prompt listing for one server, guarded by the parent server's
/// catalog scope.
pub async fn list_prompts<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    scope: CatalogScope,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpPromptRecord>> {
    ensure_sub_resource_server_visible(service, tenant_id, server_id, Some(scope)).await?;
    query.validate()?;
    let items = service.list_prompts(tenant_id, server_id).await?;
    Ok(paginate_items(filter_prompts(items, query), query))
}

/// Owner scope of the shared invocation list.
///
/// `None` is the tenant-wide admin view: only the backend asks for it. The
/// application surface always passes a scope and the store filters rows by the
/// scope's user id, so a request without a resolved actor records `0` and
/// reads no other user's row instead of widening to the tenant.
fn invocation_user_scope(scope: Option<CatalogScope>) -> Option<u64> {
    scope.map(|scope| scope.user_id)
}

/// Shared invocation listing, filtered and windowed by the store.
///
/// The application surface passes the caller scope and reads only that user's
/// invocations; the backend passes `None` and keeps the tenant-wide admin view.
/// When the query narrows to a `server_id`, the app surface also runs the
/// parent-server visibility guard so a hidden parent server stays unreadable.
pub async fn list_invocations<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    scope: Option<CatalogScope>,
    query: &McpInvocationListQuery,
) -> ApiResult<SdkWorkPageData<McpInvocationRecord>> {
    if let Some(server_id) = query.server_id {
        ensure_sub_resource_server_visible(service, tenant_id, server_id, scope).await?;
    }
    query.validate()?;
    let user_id = invocation_user_scope(scope);
    let (limit, offset) = page_bounds(&query.list);
    let (items, total) = service
        .list_invocations(
            tenant_id,
            query.server_id,
            user_id,
            query.list.search_keyword(),
            limit,
            offset,
        )
        .await?;
    Ok(page_data_from_total(items, total, &query.list))
}

pub async fn append_invocation<R: McpRepository>(
    service: &McpService<R>,
    record: McpInvocationRecord,
) -> ApiResult<SdkWorkResourceData<McpInvocationRecord>> {
    let saved = service.append_invocation(record).await?;
    Ok(item_data(saved))
}

pub async fn upsert_category<R: McpRepository>(
    service: &McpService<R>,
    record: McpServerCategoryRecord,
) -> ApiResult<SdkWorkResourceData<McpServerCategoryRecord>> {
    let saved = service.upsert_category(record).await?;
    Ok(item_data(saved))
}

pub async fn upsert_server<R: McpRepository>(
    service: &McpService<R>,
    record: McpServerRecord,
) -> ApiResult<SdkWorkResourceData<McpServerRecord>> {
    let saved = service.upsert_server(record).await?;
    Ok(item_data(saved))
}

pub async fn delete_server<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_key: &str,
) -> ApiResult<SdkWorkResourceData<McpServerRecord>> {
    let deleted = service.delete_server(tenant_id, server_key).await?;
    Ok(item_data(deleted))
}

pub async fn upsert_connector<R: McpRepository>(
    service: &McpService<R>,
    record: McpConnectorRecord,
) -> ApiResult<SdkWorkResourceData<McpConnectorRecord>> {
    let saved = service.upsert_connector(record).await?;
    Ok(item_data(saved))
}

pub async fn delete_connector<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    connector_key: &str,
) -> ApiResult<SdkWorkResourceData<McpConnectorRecord>> {
    let deleted = service
        .delete_connector(tenant_id, server_id, connector_key)
        .await?;
    Ok(item_data(deleted))
}

pub async fn delete_category<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    category_code: &str,
) -> ApiResult<SdkWorkResourceData<McpServerCategoryRecord>> {
    let deleted = service.delete_category(tenant_id, category_code).await?;
    Ok(item_data(deleted))
}

pub async fn delete_tool<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    tool_key: &str,
) -> ApiResult<SdkWorkResourceData<McpToolRecord>> {
    let deleted = service.delete_tool(tenant_id, server_id, tool_key).await?;
    Ok(item_data(deleted))
}

pub async fn delete_resource<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    resource_key: &str,
) -> ApiResult<SdkWorkResourceData<McpResourceRecord>> {
    let deleted = service
        .delete_resource(tenant_id, server_id, resource_key)
        .await?;
    Ok(item_data(deleted))
}

pub async fn delete_prompt<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    prompt_key: &str,
) -> ApiResult<SdkWorkResourceData<McpPromptRecord>> {
    let deleted = service
        .delete_prompt(tenant_id, server_id, prompt_key)
        .await?;
    Ok(item_data(deleted))
}

pub async fn upsert_tool<R: McpRepository>(
    service: &McpService<R>,
    record: McpToolRecord,
) -> ApiResult<SdkWorkResourceData<McpToolRecord>> {
    let saved = service.upsert_tool(record).await?;
    Ok(item_data(saved))
}

pub async fn upsert_resource<R: McpRepository>(
    service: &McpService<R>,
    record: McpResourceRecord,
) -> ApiResult<SdkWorkResourceData<McpResourceRecord>> {
    let saved = service.upsert_resource(record).await?;
    Ok(item_data(saved))
}

pub async fn upsert_prompt<R: McpRepository>(
    service: &McpService<R>,
    record: McpPromptRecord,
) -> ApiResult<SdkWorkResourceData<McpPromptRecord>> {
    let saved = service.upsert_prompt(record).await?;
    Ok(item_data(saved))
}

#[cfg(test)]
mod tests {
    use sdkwork_mcp_contract::{McpLifecycleStatus, McpTransportKind, McpVisibility};

    use crate::record_builders::{server_record, EntityWriteContext};

    use super::*;

    fn server(key: &str, category: Option<&str>, roles: &[&str]) -> McpServerRecord {
        let mut record = server_record(
            EntityWriteContext {
                tenant_id: 1,
                operator_id: 7,
            },
            7,
            key.to_string(),
            key.to_string(),
            McpTransportKind::Http,
            McpVisibility::Tenant,
        );
        record.category_code = category.map(str::to_string);
        record.allowed_role_codes = roles.iter().map(|role| role.to_string()).collect();
        record
    }

    #[test]
    fn catalog_visibility_only_publishes_active_servers() {
        let active = server("search", None, &[]);
        assert!(catalog_visible_server(&active));

        let mut draft = server("draft", None, &[]);
        draft.lifecycle_status = McpLifecycleStatus::Draft;
        assert!(!catalog_visible_server(&draft));

        let mut archived = server("archived", None, &[]);
        archived.lifecycle_status = McpLifecycleStatus::Archived;
        assert!(!catalog_visible_server(&archived));
    }

    /// The parent-server guard is the only decision an app-facing sub-resource
    /// read makes before reading the tools/resources/prompts/invocations of a
    /// `server_id`: a catalog-visible parent lets the read through, while a
    /// hidden one (draft, private of someone else, other organization) fails
    /// closed with the same `404` vocabulary as an unknown server.
    #[test]
    fn sub_resource_scope_allows_a_visible_parent_and_404s_a_hidden_one() {
        assert!(sub_resource_scope(true).is_ok());

        let hidden =
            sub_resource_scope(false).expect_err("a hidden parent server must be rejected");
        let rendered = format!("{hidden:?}");
        assert!(
            rendered.contains("404"),
            "expected the not-found status, got {rendered}"
        );
        assert!(
            rendered.contains("MCP server is not published"),
            "expected the catalog 404 vocabulary, got {rendered}"
        );
    }

    /// The invocation owner scope is the only difference between the app and
    /// backend call sites: the backend passes `None` and keeps the tenant-wide
    /// admin view, while the app scope becomes the row-owner filter. A request
    /// whose actor was never resolved carries the `0` sentinel and therefore
    /// stays scoped to nothing owned by another user.
    #[test]
    fn invocation_user_scope_is_none_for_admin_and_owner_scoped_for_the_app() {
        assert_eq!(invocation_user_scope(None), None);
        assert_eq!(
            invocation_user_scope(Some(CatalogScope::new(9, 42))),
            Some(42)
        );
        assert_eq!(
            invocation_user_scope(Some(CatalogScope::new(0, 0))),
            Some(0)
        );
    }
}
