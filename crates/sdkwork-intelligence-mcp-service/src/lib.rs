mod validation;

#[cfg(test)]
mod validation_tests;

use async_trait::async_trait;
use sdkwork_mcp_contract::{
    McpConnectorRecord, McpInvocationRecord, McpPromptRecord, McpResourceRecord,
    McpServerCategoryRecord, McpServerRecord, McpToolRecord,
};
use sdkwork_utils_rust::CatalogViewFilter;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum McpServiceError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("invalid argument: {0}")]
    InvalidArgument(String),
    #[error("repository error: {0}")]
    Repository(String),
}

pub type McpResult<T> = Result<T, McpServiceError>;

#[async_trait]
pub trait McpRepository: Send + Sync {
    async fn list_servers(&self, tenant_id: u64) -> McpResult<Vec<McpServerRecord>>;
    /// Admin server listing, filtered and windowed by the store.
    ///
    /// The view filter, the keyword and `limit`/`offset` all reach the database;
    /// the returned total is the filtered row count, not the page size.
    async fn list_servers_page(
        &self,
        tenant_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerRecord>, i64)>;
    /// Catalog-visible servers only: `lifecycle_status = active`, not
    /// soft-deleted, and within the caller's visibility scope (`tenant` and
    /// `public` for the whole tenant, `organization` for the caller's
    /// organization and `private` for its owner). Draft and disabled rows stay
    /// visible to the admin surface through [`McpRepository::list_servers`] but
    /// never reach application users.
    async fn list_catalog_servers(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
    ) -> McpResult<Vec<McpServerRecord>>;
    /// Catalog-visible server listing, filtered and windowed by the store and
    /// scoped to the caller's organization and user id.
    async fn list_catalog_servers_page(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerRecord>, i64)>;
    /// Catalog-visible server lookup by key under the same lifecycle gate and
    /// visibility scope as [`McpRepository::list_catalog_servers`].
    ///
    /// The plain [`McpRepository::get_server`] stays unscoped for admin and
    /// owned paths; this read returns `None` for rows the catalog would not
    /// list instead of leaking them through a guessed key.
    async fn get_catalog_server(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
        server_key: &str,
    ) -> McpResult<Option<McpServerRecord>>;
    /// True when `server_id` is catalog-visible to the caller, on the same
    /// lifecycle gate and visibility scope as
    /// [`McpRepository::get_catalog_server`].
    ///
    /// App-facing sub-resource reads (`tools`, `resources`, `prompts`,
    /// invocations filtered by `server_id`) use this to reject a known but
    /// hidden parent server before reading its children. The admin path keeps
    /// using [`McpRepository::get_server_by_id`], which stays unscoped.
    async fn catalog_server_exists(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
        server_id: u64,
    ) -> McpResult<bool>;
    async fn list_owned_servers(
        &self,
        tenant_id: u64,
        owner_user_id: u64,
    ) -> McpResult<Vec<McpServerRecord>>;
    async fn get_server(&self, tenant_id: u64, server_key: &str) -> McpResult<McpServerRecord>;
    async fn get_server_by_id(&self, tenant_id: u64, server_id: u64) -> McpResult<McpServerRecord>;
    async fn upsert_server(&self, record: McpServerRecord) -> McpResult<McpServerRecord>;
    async fn delete_server(&self, tenant_id: u64, server_key: &str) -> McpResult<McpServerRecord>;

    async fn list_categories(&self, tenant_id: u64) -> McpResult<Vec<McpServerCategoryRecord>>;
    /// Admin category listing, filtered and windowed by the store.
    ///
    /// The category selector, the keyword and `limit`/`offset` all reach the
    /// database; the returned total is the filtered row count.
    async fn list_categories_page(
        &self,
        tenant_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerCategoryRecord>, i64)>;
    /// Catalog-visible categories only: `lifecycle_status = active` and not
    /// soft-deleted. Draft, disabled and archived categories stay visible to
    /// the admin surface through [`McpRepository::list_categories`] but never
    /// reach application users, so the marketplace cannot offer a chip that
    /// files nothing.
    async fn list_catalog_categories(
        &self,
        tenant_id: u64,
    ) -> McpResult<Vec<McpServerCategoryRecord>>;
    /// Catalog-visible category listing, filtered and windowed by the store.
    async fn list_catalog_categories_page(
        &self,
        tenant_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerCategoryRecord>, i64)>;
    async fn get_category(
        &self,
        tenant_id: u64,
        category_code: &str,
    ) -> McpResult<McpServerCategoryRecord>;
    async fn upsert_category(
        &self,
        record: McpServerCategoryRecord,
    ) -> McpResult<McpServerCategoryRecord>;
    async fn delete_category(
        &self,
        tenant_id: u64,
        category_code: &str,
    ) -> McpResult<McpServerCategoryRecord>;

    async fn list_connectors(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<Vec<McpConnectorRecord>>;
    async fn get_connector(
        &self,
        tenant_id: u64,
        server_id: u64,
        connector_key: &str,
    ) -> McpResult<McpConnectorRecord>;
    async fn upsert_connector(&self, record: McpConnectorRecord) -> McpResult<McpConnectorRecord>;
    async fn delete_connector(
        &self,
        tenant_id: u64,
        server_id: u64,
        connector_key: &str,
    ) -> McpResult<McpConnectorRecord>;

    async fn list_tools(&self, tenant_id: u64, server_id: u64) -> McpResult<Vec<McpToolRecord>>;
    async fn get_tool(
        &self,
        tenant_id: u64,
        server_id: u64,
        tool_key: &str,
    ) -> McpResult<McpToolRecord>;
    async fn upsert_tool(&self, record: McpToolRecord) -> McpResult<McpToolRecord>;
    async fn delete_tool(
        &self,
        tenant_id: u64,
        server_id: u64,
        tool_key: &str,
    ) -> McpResult<McpToolRecord>;

    async fn list_resources(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<Vec<McpResourceRecord>>;
    async fn get_resource(
        &self,
        tenant_id: u64,
        server_id: u64,
        resource_key: &str,
    ) -> McpResult<McpResourceRecord>;
    async fn upsert_resource(&self, record: McpResourceRecord) -> McpResult<McpResourceRecord>;
    async fn delete_resource(
        &self,
        tenant_id: u64,
        server_id: u64,
        resource_key: &str,
    ) -> McpResult<McpResourceRecord>;

    async fn list_prompts(&self, tenant_id: u64, server_id: u64)
        -> McpResult<Vec<McpPromptRecord>>;
    async fn get_prompt(
        &self,
        tenant_id: u64,
        server_id: u64,
        prompt_key: &str,
    ) -> McpResult<McpPromptRecord>;
    async fn upsert_prompt(&self, record: McpPromptRecord) -> McpResult<McpPromptRecord>;
    async fn delete_prompt(
        &self,
        tenant_id: u64,
        server_id: u64,
        prompt_key: &str,
    ) -> McpResult<McpPromptRecord>;

    /// Invocation page filtered and windowed by the store.
    ///
    /// `user_id` narrows the rows to one owner: the application surface binds
    /// the caller's user id so it cannot read another user's request/response
    /// payloads, while `None` is the tenant-wide admin view. The returned total
    /// is the filtered row count, not the page size.
    async fn list_invocations(
        &self,
        tenant_id: u64,
        server_id: Option<u64>,
        user_id: Option<u64>,
        search: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpInvocationRecord>, i64)>;
    async fn append_invocation(
        &self,
        record: McpInvocationRecord,
    ) -> McpResult<McpInvocationRecord>;
}

pub struct McpService<R: McpRepository> {
    repository: R,
}

impl<R: McpRepository> McpService<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    pub async fn list_servers(&self, tenant_id: u64) -> McpResult<Vec<McpServerRecord>> {
        self.repository.list_servers(tenant_id).await
    }

    /// Admin server page: the store applies the view filter, the keyword and
    /// the page window, and returns the filtered total with the page rows.
    pub async fn list_servers_page(
        &self,
        tenant_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerRecord>, i64)> {
        self.repository
            .list_servers_page(tenant_id, filter, keyword, limit, offset)
            .await
    }

    /// Catalog listing for application users; drafts and disabled rows are
    /// excluded by the repository query, which also applies the caller's
    /// organization and user visibility scope.
    pub async fn list_catalog_servers(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
    ) -> McpResult<Vec<McpServerRecord>> {
        self.repository
            .list_catalog_servers(tenant_id, organization_id, user_id)
            .await
    }

    /// Catalog-visible server page, filtered and windowed by the store and
    /// scoped to the caller.
    pub async fn list_catalog_servers_page(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerRecord>, i64)> {
        self.repository
            .list_catalog_servers_page(
                tenant_id,
                organization_id,
                user_id,
                filter,
                keyword,
                limit,
                offset,
            )
            .await
    }

    /// Catalog-visible server lookup by key; `None` when the catalog would not
    /// list the row for this caller.
    pub async fn get_catalog_server(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
        server_key: &str,
    ) -> McpResult<Option<McpServerRecord>> {
        validation::validate_server_key(server_key)?;
        self.repository
            .get_catalog_server(tenant_id, organization_id, user_id, server_key)
            .await
    }

    /// True when the parent server of an app-facing sub-resource read is
    /// catalog-visible to the caller.
    pub async fn catalog_server_exists(
        &self,
        tenant_id: u64,
        organization_id: u64,
        user_id: u64,
        server_id: u64,
    ) -> McpResult<bool> {
        self.repository
            .catalog_server_exists(tenant_id, organization_id, user_id, server_id)
            .await
    }

    pub async fn list_owned_servers(
        &self,
        tenant_id: u64,
        owner_user_id: u64,
    ) -> McpResult<Vec<McpServerRecord>> {
        self.repository
            .list_owned_servers(tenant_id, owner_user_id)
            .await
    }

    pub async fn get_server(&self, tenant_id: u64, server_key: &str) -> McpResult<McpServerRecord> {
        validation::validate_server_key(server_key)?;
        self.repository.get_server(tenant_id, server_key).await
    }

    pub async fn get_server_by_id(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<McpServerRecord> {
        self.repository.get_server_by_id(tenant_id, server_id).await
    }

    pub async fn upsert_server(&self, record: McpServerRecord) -> McpResult<McpServerRecord> {
        validation::validate_server_record(&record)?;
        self.repository.upsert_server(record).await
    }

    pub async fn delete_server(
        &self,
        tenant_id: u64,
        server_key: &str,
    ) -> McpResult<McpServerRecord> {
        validation::validate_server_key(server_key)?;
        self.repository.delete_server(tenant_id, server_key).await
    }

    pub async fn list_categories(&self, tenant_id: u64) -> McpResult<Vec<McpServerCategoryRecord>> {
        self.repository.list_categories(tenant_id).await
    }

    /// Admin category page: the store applies the category selector, the
    /// keyword and the page window, and returns the filtered total.
    pub async fn list_categories_page(
        &self,
        tenant_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerCategoryRecord>, i64)> {
        self.repository
            .list_categories_page(tenant_id, filter, keyword, limit, offset)
            .await
    }

    /// Catalog-visible categories for the marketplace surface.
    pub async fn list_catalog_categories(
        &self,
        tenant_id: u64,
    ) -> McpResult<Vec<McpServerCategoryRecord>> {
        self.repository.list_catalog_categories(tenant_id).await
    }

    /// Catalog-visible category page, filtered and windowed by the store.
    pub async fn list_catalog_categories_page(
        &self,
        tenant_id: u64,
        filter: &CatalogViewFilter,
        keyword: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpServerCategoryRecord>, i64)> {
        self.repository
            .list_catalog_categories_page(tenant_id, filter, keyword, limit, offset)
            .await
    }

    pub async fn get_category(
        &self,
        tenant_id: u64,
        category_code: &str,
    ) -> McpResult<McpServerCategoryRecord> {
        validation::validate_category_code(category_code)?;
        self.repository.get_category(tenant_id, category_code).await
    }

    pub async fn upsert_category(
        &self,
        record: McpServerCategoryRecord,
    ) -> McpResult<McpServerCategoryRecord> {
        validation::validate_category_record(&record)?;
        self.repository.upsert_category(record).await
    }

    pub async fn delete_category(
        &self,
        tenant_id: u64,
        category_code: &str,
    ) -> McpResult<McpServerCategoryRecord> {
        validation::validate_category_code(category_code)?;
        let category = self
            .repository
            .get_category(tenant_id, category_code)
            .await?;
        let servers = self.repository.list_servers(tenant_id).await?;
        let categories = self.repository.list_categories(tenant_id).await?;
        let server_refs = servers
            .iter()
            .filter(|server| server.category_code.as_deref() == Some(category_code))
            .count();
        let child_refs = categories
            .iter()
            .filter(|child| child.parent_id == category.id)
            .count();
        if server_refs > 0 || child_refs > 0 {
            return Err(McpServiceError::InvalidArgument(format!(
                "category {category_code} is still referenced by {server_refs} server(s) and {child_refs} child categor(ies)"
            )));
        }
        self.repository
            .delete_category(tenant_id, category_code)
            .await
    }

    pub async fn list_connectors(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<Vec<McpConnectorRecord>> {
        self.repository.list_connectors(tenant_id, server_id).await
    }

    pub async fn get_connector(
        &self,
        tenant_id: u64,
        server_id: u64,
        connector_key: &str,
    ) -> McpResult<McpConnectorRecord> {
        validation::validate_connector_key(connector_key)?;
        self.repository
            .get_connector(tenant_id, server_id, connector_key)
            .await
    }

    pub async fn upsert_connector(
        &self,
        record: McpConnectorRecord,
    ) -> McpResult<McpConnectorRecord> {
        validation::validate_connector_record(&record)?;
        self.repository.upsert_connector(record).await
    }

    pub async fn delete_connector(
        &self,
        tenant_id: u64,
        server_id: u64,
        connector_key: &str,
    ) -> McpResult<McpConnectorRecord> {
        validation::validate_connector_key(connector_key)?;
        self.repository
            .delete_connector(tenant_id, server_id, connector_key)
            .await
    }

    pub async fn list_tools(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<Vec<McpToolRecord>> {
        self.repository.list_tools(tenant_id, server_id).await
    }

    pub async fn get_tool(
        &self,
        tenant_id: u64,
        server_id: u64,
        tool_key: &str,
    ) -> McpResult<McpToolRecord> {
        validation::validate_entity_key(tool_key, "tool_key")?;
        self.repository
            .get_tool(tenant_id, server_id, tool_key)
            .await
    }

    pub async fn upsert_tool(&self, record: McpToolRecord) -> McpResult<McpToolRecord> {
        validation::validate_tool_record(&record)?;
        self.repository.upsert_tool(record).await
    }

    pub async fn delete_tool(
        &self,
        tenant_id: u64,
        server_id: u64,
        tool_key: &str,
    ) -> McpResult<McpToolRecord> {
        validation::validate_entity_key(tool_key, "tool_key")?;
        self.repository
            .delete_tool(tenant_id, server_id, tool_key)
            .await
    }

    pub async fn list_resources(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<Vec<McpResourceRecord>> {
        self.repository.list_resources(tenant_id, server_id).await
    }

    pub async fn get_resource(
        &self,
        tenant_id: u64,
        server_id: u64,
        resource_key: &str,
    ) -> McpResult<McpResourceRecord> {
        validation::validate_entity_key(resource_key, "resource_key")?;
        self.repository
            .get_resource(tenant_id, server_id, resource_key)
            .await
    }

    pub async fn upsert_resource(&self, record: McpResourceRecord) -> McpResult<McpResourceRecord> {
        validation::validate_resource_record(&record)?;
        self.repository.upsert_resource(record).await
    }

    pub async fn delete_resource(
        &self,
        tenant_id: u64,
        server_id: u64,
        resource_key: &str,
    ) -> McpResult<McpResourceRecord> {
        validation::validate_entity_key(resource_key, "resource_key")?;
        self.repository
            .delete_resource(tenant_id, server_id, resource_key)
            .await
    }

    pub async fn list_prompts(
        &self,
        tenant_id: u64,
        server_id: u64,
    ) -> McpResult<Vec<McpPromptRecord>> {
        self.repository.list_prompts(tenant_id, server_id).await
    }

    pub async fn get_prompt(
        &self,
        tenant_id: u64,
        server_id: u64,
        prompt_key: &str,
    ) -> McpResult<McpPromptRecord> {
        validation::validate_entity_key(prompt_key, "prompt_key")?;
        self.repository
            .get_prompt(tenant_id, server_id, prompt_key)
            .await
    }

    pub async fn upsert_prompt(&self, record: McpPromptRecord) -> McpResult<McpPromptRecord> {
        validation::validate_prompt_record(&record)?;
        self.repository.upsert_prompt(record).await
    }

    pub async fn delete_prompt(
        &self,
        tenant_id: u64,
        server_id: u64,
        prompt_key: &str,
    ) -> McpResult<McpPromptRecord> {
        validation::validate_entity_key(prompt_key, "prompt_key")?;
        self.repository
            .delete_prompt(tenant_id, server_id, prompt_key)
            .await
    }

    /// Invocation page: the store applies the `server_id`, owner `user_id` and
    /// keyword filters plus the page window, and returns the filtered total
    /// with the page rows.
    pub async fn list_invocations(
        &self,
        tenant_id: u64,
        server_id: Option<u64>,
        user_id: Option<u64>,
        search: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> McpResult<(Vec<McpInvocationRecord>, i64)> {
        self.repository
            .list_invocations(tenant_id, server_id, user_id, search, limit, offset)
            .await
    }

    pub async fn append_invocation(
        &self,
        record: McpInvocationRecord,
    ) -> McpResult<McpInvocationRecord> {
        validation::validate_invocation_record(&record)?;
        self.repository.append_invocation(record).await
    }
}
