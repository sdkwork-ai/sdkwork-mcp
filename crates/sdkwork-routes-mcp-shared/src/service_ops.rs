use sdkwork_intelligence_mcp_service::{McpRepository, McpService, McpServiceError};
use sdkwork_mcp_contract::{
    McpConnectorRecord, McpInvocationRecord, McpPromptRecord, McpResourceRecord,
    McpServerCategoryRecord, McpServerRecord, McpToolRecord,
};
use sdkwork_utils_rust::{SdkWorkPageData, SdkWorkResourceData};

use crate::list_query::{McpInvocationListQuery, SdkWorkListQuery};
use crate::response::{item_data, page_data, paginate_items, ApiProblem, ApiResult};

impl From<McpServiceError> for ApiProblem {
    fn from(error: McpServiceError) -> Self {
        match error {
            McpServiceError::NotFound(message) => ApiProblem::not_found(message),
            McpServiceError::InvalidArgument(message) => ApiProblem::bad_request(message),
            McpServiceError::Repository(message) => ApiProblem::internal_server_error(message),
        }
    }
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

fn filter_categories(
    items: Vec<McpServerCategoryRecord>,
    query: &SdkWorkListQuery,
) -> Vec<McpServerCategoryRecord> {
    filter_by_keyword(items, query, |item, keyword| {
        item.name.to_lowercase().contains(keyword)
            || item.category_code.to_lowercase().contains(keyword)
    })
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
    let items = service.list_categories(tenant_id).await?;
    Ok(paginate_items(filter_categories(items, query), query))
}

pub async fn list_servers<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpServerRecord>> {
    query.validate()?;
    let items = service.list_servers(tenant_id).await?;
    Ok(paginate_items(filter_servers(items, query), query))
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

pub async fn list_tools<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpToolRecord>> {
    query.validate()?;
    let items = service.list_tools(tenant_id, server_id).await?;
    Ok(paginate_items(filter_tools(items, query), query))
}

pub async fn get_tool<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    tool_key: &str,
) -> ApiResult<SdkWorkResourceData<McpToolRecord>> {
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

pub async fn get_resource<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    resource_key: &str,
) -> ApiResult<SdkWorkResourceData<McpResourceRecord>> {
    let record = service
        .get_resource(tenant_id, server_id, resource_key)
        .await?;
    Ok(item_data(record))
}

pub async fn get_prompt<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    prompt_key: &str,
) -> ApiResult<SdkWorkResourceData<McpPromptRecord>> {
    let record = service
        .get_prompt(tenant_id, server_id, prompt_key)
        .await?;
    Ok(item_data(record))
}

pub async fn list_resources<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpResourceRecord>> {
    query.validate()?;
    let items = service.list_resources(tenant_id, server_id).await?;
    Ok(paginate_items(filter_resources(items, query), query))
}

pub async fn list_prompts<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    server_id: u64,
    query: &SdkWorkListQuery,
) -> ApiResult<SdkWorkPageData<McpPromptRecord>> {
    query.validate()?;
    let items = service.list_prompts(tenant_id, server_id).await?;
    Ok(paginate_items(filter_prompts(items, query), query))
}

pub async fn list_invocations<R: McpRepository>(
    service: &McpService<R>,
    tenant_id: u64,
    query: &McpInvocationListQuery,
) -> ApiResult<SdkWorkPageData<McpInvocationRecord>> {
    query.validate()?;
    let page_size = query.list.effective_page_size() as u32;
    let page = query.list.effective_page() as u32;
    let offset = (page.saturating_sub(1)) * page_size;
    let search = query.list.search_keyword();
    let total = service
        .count_invocations(tenant_id, query.server_id, search)
        .await?;
    let items = service
        .list_invocations(tenant_id, query.server_id, search, offset, page_size)
        .await?;
    Ok(page_data(items, total as usize, &query.list))
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
