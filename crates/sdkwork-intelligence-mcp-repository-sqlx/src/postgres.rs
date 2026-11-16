use sdkwork_intelligence_mcp_service::{McpResult, McpServiceError};
use sdkwork_mcp_contract::{
    McpAuthKind, McpConnectorRecord, McpDataScope, McpHealthStatus, McpInvocationKind,
    McpInvocationRecord, McpLifecycleStatus, McpPromptRecord, McpPublishStatus, McpResourceRecord,
    McpServerCategoryRecord, McpServerRecord, McpToolRecord, McpTransportKind, McpVisibility,
};
use sdkwork_utils_rust::{CatalogViewFilter, LIST_TOTAL_SQL_COLUMN};
use sqlx::{PgPool, Row};

use crate::entity_ids::{new_mcp_snowflake_id, new_mcp_uuid};
use crate::json_util::{
    json_value_to_string, parse_json_value, string_list_from_json, string_list_to_json,
    timestamp_to_rfc3339,
};

const ACTIVE_ENTITY_FILTER: &str = "deleted_at IS NULL AND lifecycle_status <> 4";

/// Catalog visibility for application users. Only published (`active`) rows
/// that have not been soft-deleted are part of the catalog; drafts, disabled
/// and archived rows stay admin-only through [`ACTIVE_ENTITY_FILTER`].
const CATALOG_VISIBLE_FILTER: &str = "deleted_at IS NULL AND lifecycle_status = 1";

const CATEGORY_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
    sort_order, icon_ref, lifecycle_status, version, created_at, updated_at, created_by,
    updated_by, deleted_at
"#;

const SERVER_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
    category_id, category_code, transport, visibility, data_scope, latest_connector_id,
    published_connector_id, health_status, last_checked_at, last_error_masked,
    lifecycle_status, tags_json, allowed_role_codes, icon_ref, published_at, deprecated_at,
    version, created_at, updated_at, created_by, updated_by, deleted_at
"#;

const CONNECTOR_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status, transport,
    endpoint_url, command_ref, args_json, env_schema_json, auth_type, secret_ref, timeout_ms,
    retry_policy_json, config_hash, lifecycle_status, version, created_at, updated_at,
    created_by, updated_by, deleted_at
"#;

const TOOL_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, server_id, connector_id, tool_key, name, description,
    input_schema_json, output_schema_json, risk_level, requires_approval, enabled, lifecycle_status,
    rate_limit_policy_json, schema_hash, discovered_at, last_invoked_at, sort_weight, version,
    created_at, updated_at, created_by, updated_by, deleted_at
"#;

const RESOURCE_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, server_id, connector_id, resource_key, uri, name,
    description, mime_type, enabled, lifecycle_status, discovered_at, version, created_at,
    updated_at, created_by, updated_by, deleted_at
"#;

const PROMPT_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, server_id, connector_id, prompt_key, name, description,
    arguments_schema_json, enabled, lifecycle_status, discovered_at, version, created_at, updated_at,
    created_by, updated_by, deleted_at
"#;

const INVOCATION_SELECT: &str = r#"
    id, uuid, tenant_id, organization_id, user_id, server_id, connector_id, invocation_kind,
    target_key, request_id, trace_id, idempotency_key, request_json, response_json, status,
    error_message, duration_ms, invoked_at, created_at
"#;

/// Invocation page: one static statement whose nullable binds express every
/// filter combination, so the store owns optional `server_id`, owner `user_id`,
/// keyword filtering and the page window instead of four hand-written variants.
///
/// `$1` is the tenant, `$2` the optional `server_id`, `$3` the optional owner
/// `user_id`, `$4` the lowercased keyword pattern and `$5`/`$6` the page
/// window. A `NULL` bind disables its predicate: the backend admin list passes
/// `NULL` for `$2`/`$3` and reads every tenant row, while the application
/// surface binds the caller's user id so it can only read its own payloads.
///
/// `COUNT(*) OVER()` runs after the predicates, so the window total is the
/// filtered count while `LIMIT`/`OFFSET` return one page.
const INVOCATION_PAGE_SQL: &str = r#"
    SELECT
        id, uuid, tenant_id, organization_id, user_id, server_id, connector_id, invocation_kind,
        target_key, request_id, trace_id, idempotency_key, request_json, response_json, status,
        error_message, duration_ms, invoked_at, created_at,
        COUNT(*) OVER() AS __list_total
    FROM ai_mcp_invocation_log
    WHERE tenant_id = $1
      AND ($2::bigint IS NULL OR server_id = $2)
      AND ($3::bigint IS NULL OR user_id = $3)
      AND ($4::text IS NULL OR target_key ILIKE $4)
    ORDER BY invoked_at DESC, id DESC
    LIMIT $5 OFFSET $6
"#;

/// Admin server page: `COUNT(*) OVER()` runs after the filters, so the window
/// total is the filtered count while `LIMIT`/`OFFSET` return one page.
///
/// `$2` is the normalized category code, `$3` the caller's IAM role scope,
/// `$4` the lowercased keyword pattern and `$5`/`$6` the page window. The role
/// predicate keeps open rows (`allowed_role_codes` empty) plus rows that name
/// one of the caller's roles.
const SERVER_PAGE_SQL: &str = r#"
    SELECT
        id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
        category_id, category_code, transport, visibility, data_scope, latest_connector_id,
        published_connector_id, health_status, last_checked_at, last_error_masked,
        lifecycle_status, tags_json, allowed_role_codes, icon_ref, published_at, deprecated_at,
        version, created_at, updated_at, created_by, updated_by, deleted_at,
        COUNT(*) OVER() AS __list_total
    FROM ai_mcp_server
    WHERE tenant_id = $1 AND deleted_at IS NULL AND lifecycle_status <> 4
      AND ($2::text IS NULL OR LOWER(category_code) = $2)
      AND (cardinality($3::text[]) = 0
           OR jsonb_array_length(allowed_role_codes) = 0
           OR allowed_role_codes ?| $3::text[])
      AND ($4::text IS NULL
           OR LOWER(server_key) LIKE $4
           OR LOWER(name) LIKE $4
           OR LOWER(COALESCE(description, '')) LIKE $4
           OR LOWER(COALESCE(category_code, '')) LIKE $4
           OR LOWER(tags_json::text) LIKE $4)
    ORDER BY updated_at DESC, server_key ASC
    LIMIT $5 OFFSET $6
"#;

/// Catalog server page: same shape as [`SERVER_PAGE_SQL`] restricted to
/// catalog-visible rows, so drafts and disabled servers never enter the total.
///
/// `$1` is the tenant, `$2` the caller's organization id, `$3` the caller's
/// user id, `$4` the normalized category code, `$5` the caller's IAM role
/// scope, `$6` the lowercased keyword pattern and `$7`/`$8` the page window.
/// The visibility predicate gives `tenant` and `public` rows to the whole
/// tenant, `organization` rows to the caller's organization (`0` is the
/// tenant-level sentinel) and `private` rows to their owner.
const CATALOG_SERVER_PAGE_SQL: &str = r#"
    SELECT
        id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
        category_id, category_code, transport, visibility, data_scope, latest_connector_id,
        published_connector_id, health_status, last_checked_at, last_error_masked,
        lifecycle_status, tags_json, allowed_role_codes, icon_ref, published_at, deprecated_at,
        version, created_at, updated_at, created_by, updated_by, deleted_at,
        COUNT(*) OVER() AS __list_total
    FROM ai_mcp_server
    WHERE tenant_id = $1 AND deleted_at IS NULL AND lifecycle_status = 1
      AND (visibility IN ('tenant', 'public')
           OR (visibility = 'organization' AND organization_id = $2)
           OR (visibility = 'private' AND owner_user_id = $3))
      AND ($4::text IS NULL OR LOWER(category_code) = $4)
      AND (cardinality($5::text[]) = 0
           OR jsonb_array_length(allowed_role_codes) = 0
           OR allowed_role_codes ?| $5::text[])
      AND ($6::text IS NULL
           OR LOWER(server_key) LIKE $6
           OR LOWER(name) LIKE $6
           OR LOWER(COALESCE(description, '')) LIKE $6
           OR LOWER(COALESCE(category_code, '')) LIKE $6
           OR LOWER(tags_json::text) LIKE $6)
    ORDER BY updated_at DESC, server_key ASC
    LIMIT $7 OFFSET $8
"#;

/// Admin category page: `$2` is the normalized category code, `$3` the
/// lowercased keyword pattern and `$4`/`$5` the page window.
const CATEGORY_PAGE_SQL: &str = r#"
    SELECT
        id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
        sort_order, icon_ref, lifecycle_status, version, created_at, updated_at, created_by,
        updated_by, deleted_at,
        COUNT(*) OVER() AS __list_total
    FROM ai_mcp_server_category
    WHERE tenant_id IN (0, $1) AND deleted_at IS NULL AND lifecycle_status <> 4
      AND ($2::text IS NULL OR LOWER(category_code) = $2)
      AND ($3::text IS NULL
           OR LOWER(category_code) LIKE $3
           OR LOWER(name) LIKE $3
           OR LOWER(COALESCE(description, '')) LIKE $3)
    ORDER BY sort_order ASC, category_code ASC
    LIMIT $4 OFFSET $5
"#;

/// Catalog category page: same shape as [`CATEGORY_PAGE_SQL`] restricted to
/// the marketplace taxonomy.
const CATALOG_CATEGORY_PAGE_SQL: &str = r#"
    SELECT
        id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
        sort_order, icon_ref, lifecycle_status, version, created_at, updated_at, created_by,
        updated_by, deleted_at,
        COUNT(*) OVER() AS __list_total
    FROM ai_mcp_server_category
    WHERE tenant_id IN (0, $1) AND deleted_at IS NULL AND lifecycle_status = 1
      AND ($2::text IS NULL OR LOWER(category_code) = $2)
      AND ($3::text IS NULL
           OR LOWER(category_code) LIKE $3
           OR LOWER(name) LIKE $3
           OR LOWER(COALESCE(description, '')) LIKE $3)
    ORDER BY sort_order ASC, category_code ASC
    LIMIT $4 OFFSET $5
"#;

/// Visibility scope predicate shared by every catalog read of `ai_mcp_server`.
///
/// `tenant` and `public` rows are visible to the whole tenant; `organization`
/// rows only to a caller inside that organization (`0` is the tenant-level
/// sentinel) and `private` rows only to their owner. The two placeholders are
/// passed in so each statement can position its own bind parameters while all
/// catalog statements keep the same rule: `$2` is the organization id and `$3`
/// the user id in [`CATALOG_SERVER_PAGE_SQL`], `list_catalog_servers` and the
/// `get_catalog_server`/`catalog_server_exists` statements.
fn catalog_visibility_scope(organization_param: &str, user_param: &str) -> String {
    format!(
        "(visibility IN ('tenant', 'public') \
         OR (visibility = 'organization' AND organization_id = {organization_param}) \
         OR (visibility = 'private' AND owner_user_id = {user_param}))"
    )
}

/// Catalog server lookup by key: the catalog lifecycle gate plus the caller's
/// visibility scope narrowed to one `server_key`.
///
/// `$1` is the tenant, `$2` the caller's organization id, `$3` the caller's
/// user id and `$4` the server key.
fn catalog_server_get_sql() -> String {
    format!(
        r#"
        SELECT {SERVER_SELECT}
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND {CATALOG_VISIBLE_FILTER}
          AND {}
          AND server_key = $4
        LIMIT 1
        "#,
        catalog_visibility_scope("$2", "$3")
    )
}

/// Catalog server existence by id: the same lifecycle gate and caller scope as
/// [`catalog_server_get_sql`], narrowed to one `id` so an app-facing
/// sub-resource read cannot reach a parent server the catalog hides.
///
/// `$1` is the tenant, `$2` the caller's organization id, `$3` the caller's
/// user id and `$4` the server id. `SELECT 1` keeps the guard a pure existence
/// probe: the caller needs a boolean, not the row.
fn catalog_server_exists_sql() -> String {
    format!(
        r#"
        SELECT 1
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND {CATALOG_VISIBLE_FILTER}
          AND {}
          AND id = $4
        LIMIT 1
        "#,
        catalog_visibility_scope("$2", "$3")
    )
}

fn map_sqlx(error: sqlx::Error) -> McpServiceError {
    McpServiceError::Repository(error.to_string())
}

/// Lowercased `%keyword%` pattern for the paged list predicates.
///
/// `LIKE` metacharacters in user input are escaped so the store keyword keeps
/// the literal-substring meaning of the in-memory filters it replaces; `None`
/// leaves the keyword predicate inactive.
fn keyword_like_pattern(keyword: Option<&str>) -> Option<String> {
    keyword
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| {
            let escaped = value
                .to_lowercase()
                .replace('\\', "\\\\")
                .replace('%', "\\%")
                .replace('_', "\\_");
            format!("%{escaped}%")
        })
}

/// Splits a windowed page into its rows and the `COUNT(*) OVER()` total.
///
/// The window counts the whole filtered set, so an in-range page carries the
/// exact total. A page past the end has no row to carry it and reports zero
/// here; the paged readers re-read the first row of the same query in that case
/// so `pageInfo.totalItems` never depends on the requested page.
fn map_page<T>(
    rows: Vec<sqlx::postgres::PgRow>,
    mapper: fn(&sqlx::postgres::PgRow) -> McpResult<T>,
) -> McpResult<(Vec<T>, i64)> {
    let total = match rows.first() {
        Some(row) => row
            .try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN)
            .map_err(map_sqlx)?,
        None => 0,
    };
    let items = rows.iter().map(mapper).collect::<McpResult<Vec<_>>>()?;
    Ok((items, total))
}

fn resolve_entity_id(id: u64) -> i64 {
    if id == 0 {
        new_mcp_snowflake_id() as i64
    } else {
        id as i64
    }
}

fn resolve_entity_uuid(uuid: &str) -> String {
    if uuid.is_empty() {
        new_mcp_uuid()
    } else {
        uuid.to_string()
    }
}

fn read_json_string(row: &sqlx::postgres::PgRow, field: &str) -> McpResult<String> {
    json_value_to_string(
        row.try_get::<serde_json::Value, _>(field)
            .map_err(map_sqlx)?,
        field,
    )
}

fn read_optional_json_string(
    row: &sqlx::postgres::PgRow,
    field: &str,
) -> McpResult<Option<String>> {
    match row
        .try_get::<Option<serde_json::Value>, _>(field)
        .map_err(map_sqlx)?
    {
        None => Ok(None),
        Some(value) => Ok(Some(json_value_to_string(value, field)?)),
    }
}

fn bind_json_string(input: &str, field: &str) -> McpResult<serde_json::Value> {
    parse_json_value(input, field)
}

fn bind_optional_json_string(
    input: &Option<String>,
    field: &str,
) -> McpResult<Option<serde_json::Value>> {
    match input {
        None => Ok(None),
        Some(value) => Ok(Some(parse_json_value(value, field)?)),
    }
}

fn map_transport(value: &str) -> McpResult<McpTransportKind> {
    McpTransportKind::parse(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid transport: {value}")))
}

fn map_auth(value: &str) -> McpResult<McpAuthKind> {
    McpAuthKind::parse(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid auth_type: {value}")))
}

fn map_visibility(value: &str) -> McpResult<McpVisibility> {
    McpVisibility::parse(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid visibility: {value}")))
}

fn map_lifecycle(value: i16) -> McpResult<McpLifecycleStatus> {
    McpLifecycleStatus::from_db_code(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid lifecycle status: {value}")))
}

fn map_health(value: &str) -> McpResult<McpHealthStatus> {
    McpHealthStatus::parse(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid health_status: {value}")))
}

fn map_publish_status(value: &str) -> McpResult<McpPublishStatus> {
    McpPublishStatus::parse(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid publish_status: {value}")))
}

fn map_data_scope(value: i16) -> McpResult<McpDataScope> {
    McpDataScope::from_db_code(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid data_scope: {value}")))
}

fn map_invocation_kind(value: &str) -> McpResult<McpInvocationKind> {
    McpInvocationKind::parse(value)
        .ok_or_else(|| McpServiceError::Repository(format!("invalid invocation_kind: {value}")))
}

fn row_to_category(row: &sqlx::postgres::PgRow) -> McpResult<McpServerCategoryRecord> {
    Ok(McpServerCategoryRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        category_code: row.try_get("category_code").map_err(map_sqlx)?,
        name: row.try_get("name").map_err(map_sqlx)?,
        description: row.try_get("description").map_err(map_sqlx)?,
        parent_id: row.try_get::<i64, _>("parent_id").map_err(map_sqlx)? as u64,
        sort_order: row.try_get("sort_order").map_err(map_sqlx)?,
        icon_ref: row.try_get("icon_ref").map_err(map_sqlx)?,
        lifecycle_status: map_lifecycle(row.try_get("lifecycle_status").map_err(map_sqlx)?)?,
        version: row.try_get::<i64, _>("version").map_err(map_sqlx)? as u64,
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
        updated_at: timestamp_to_rfc3339(row.try_get("updated_at").map_err(map_sqlx)?),
        created_by: row.try_get::<i64, _>("created_by").map_err(map_sqlx)? as u64,
        updated_by: row.try_get::<i64, _>("updated_by").map_err(map_sqlx)? as u64,
        deleted_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deleted_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
    })
}

fn row_to_server(row: &sqlx::postgres::PgRow) -> McpResult<McpServerRecord> {
    Ok(McpServerRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        owner_user_id: row.try_get::<i64, _>("owner_user_id").map_err(map_sqlx)? as u64,
        server_key: row.try_get("server_key").map_err(map_sqlx)?,
        name: row.try_get("name").map_err(map_sqlx)?,
        description: row.try_get("description").map_err(map_sqlx)?,
        category_id: row
            .try_get::<Option<i64>, _>("category_id")
            .map_err(map_sqlx)?
            .map(|value| value as u64),
        category_code: row.try_get("category_code").map_err(map_sqlx)?,
        transport: map_transport(
            row.try_get::<String, _>("transport")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        visibility: map_visibility(
            row.try_get::<String, _>("visibility")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        data_scope: map_data_scope(row.try_get("data_scope").map_err(map_sqlx)?)?,
        latest_connector_id: row
            .try_get::<Option<i64>, _>("latest_connector_id")
            .map_err(map_sqlx)?
            .map(|value| value as u64),
        published_connector_id: row
            .try_get::<Option<i64>, _>("published_connector_id")
            .map_err(map_sqlx)?
            .map(|value| value as u64),
        health_status: map_health(
            row.try_get::<String, _>("health_status")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        last_checked_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("last_checked_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        last_error_masked: row.try_get("last_error_masked").map_err(map_sqlx)?,
        lifecycle_status: map_lifecycle(row.try_get("lifecycle_status").map_err(map_sqlx)?)?,
        tags: string_list_from_json(read_json_string(row, "tags_json")?.as_str(), "tags_json")?,
        allowed_role_codes: string_list_from_json(
            read_json_string(row, "allowed_role_codes")?.as_str(),
            "allowed_role_codes",
        )?,
        icon_ref: row.try_get("icon_ref").map_err(map_sqlx)?,
        published_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("published_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        deprecated_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deprecated_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        version: row.try_get::<i64, _>("version").map_err(map_sqlx)? as u64,
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
        updated_at: timestamp_to_rfc3339(row.try_get("updated_at").map_err(map_sqlx)?),
        created_by: row.try_get::<i64, _>("created_by").map_err(map_sqlx)? as u64,
        updated_by: row.try_get::<i64, _>("updated_by").map_err(map_sqlx)? as u64,
        deleted_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deleted_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
    })
}

fn row_to_connector(row: &sqlx::postgres::PgRow) -> McpResult<McpConnectorRecord> {
    Ok(McpConnectorRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        server_id: row.try_get::<i64, _>("server_id").map_err(map_sqlx)? as u64,
        connector_key: row.try_get("connector_key").map_err(map_sqlx)?,
        publish_status: map_publish_status(
            row.try_get::<String, _>("publish_status")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        transport: map_transport(
            row.try_get::<String, _>("transport")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        endpoint_url: row.try_get("endpoint_url").map_err(map_sqlx)?,
        command_ref: row.try_get("command_ref").map_err(map_sqlx)?,
        args_json: read_json_string(row, "args_json")?,
        env_schema_json: read_json_string(row, "env_schema_json")?,
        auth_type: map_auth(
            row.try_get::<String, _>("auth_type")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        secret_ref: row.try_get("secret_ref").map_err(map_sqlx)?,
        timeout_ms: row.try_get::<i32, _>("timeout_ms").map_err(map_sqlx)? as u32,
        retry_policy_json: read_json_string(row, "retry_policy_json")?,
        config_hash: row.try_get("config_hash").map_err(map_sqlx)?,
        lifecycle_status: map_lifecycle(row.try_get("lifecycle_status").map_err(map_sqlx)?)?,
        version: row.try_get::<i64, _>("version").map_err(map_sqlx)? as u64,
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
        updated_at: timestamp_to_rfc3339(row.try_get("updated_at").map_err(map_sqlx)?),
        created_by: row.try_get::<i64, _>("created_by").map_err(map_sqlx)? as u64,
        updated_by: row.try_get::<i64, _>("updated_by").map_err(map_sqlx)? as u64,
        deleted_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deleted_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
    })
}

fn row_to_tool(row: &sqlx::postgres::PgRow) -> McpResult<McpToolRecord> {
    Ok(McpToolRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        server_id: row.try_get::<i64, _>("server_id").map_err(map_sqlx)? as u64,
        connector_id: row.try_get::<i64, _>("connector_id").map_err(map_sqlx)? as u64,
        tool_key: row.try_get("tool_key").map_err(map_sqlx)?,
        name: row.try_get("name").map_err(map_sqlx)?,
        description: row.try_get("description").map_err(map_sqlx)?,
        input_schema_json: read_json_string(row, "input_schema_json")?,
        output_schema_json: read_json_string(row, "output_schema_json")?,
        risk_level: row.try_get("risk_level").map_err(map_sqlx)?,
        requires_approval: row.try_get("requires_approval").map_err(map_sqlx)?,
        enabled: row.try_get("enabled").map_err(map_sqlx)?,
        lifecycle_status: map_lifecycle(row.try_get("lifecycle_status").map_err(map_sqlx)?)?,
        rate_limit_policy_json: read_json_string(row, "rate_limit_policy_json")?,
        schema_hash: row.try_get("schema_hash").map_err(map_sqlx)?,
        discovered_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("discovered_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        last_invoked_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("last_invoked_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        sort_weight: row.try_get("sort_weight").map_err(map_sqlx)?,
        version: row.try_get::<i64, _>("version").map_err(map_sqlx)? as u64,
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
        updated_at: timestamp_to_rfc3339(row.try_get("updated_at").map_err(map_sqlx)?),
        created_by: row.try_get::<i64, _>("created_by").map_err(map_sqlx)? as u64,
        updated_by: row.try_get::<i64, _>("updated_by").map_err(map_sqlx)? as u64,
        deleted_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deleted_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
    })
}

fn row_to_resource(row: &sqlx::postgres::PgRow) -> McpResult<McpResourceRecord> {
    Ok(McpResourceRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        server_id: row.try_get::<i64, _>("server_id").map_err(map_sqlx)? as u64,
        connector_id: row.try_get::<i64, _>("connector_id").map_err(map_sqlx)? as u64,
        resource_key: row.try_get("resource_key").map_err(map_sqlx)?,
        uri: row.try_get("uri").map_err(map_sqlx)?,
        name: row.try_get("name").map_err(map_sqlx)?,
        description: row.try_get("description").map_err(map_sqlx)?,
        mime_type: row.try_get("mime_type").map_err(map_sqlx)?,
        enabled: row.try_get("enabled").map_err(map_sqlx)?,
        lifecycle_status: map_lifecycle(row.try_get("lifecycle_status").map_err(map_sqlx)?)?,
        discovered_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("discovered_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        version: row.try_get::<i64, _>("version").map_err(map_sqlx)? as u64,
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
        updated_at: timestamp_to_rfc3339(row.try_get("updated_at").map_err(map_sqlx)?),
        created_by: row.try_get::<i64, _>("created_by").map_err(map_sqlx)? as u64,
        updated_by: row.try_get::<i64, _>("updated_by").map_err(map_sqlx)? as u64,
        deleted_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deleted_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
    })
}

fn row_to_prompt(row: &sqlx::postgres::PgRow) -> McpResult<McpPromptRecord> {
    Ok(McpPromptRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        server_id: row.try_get::<i64, _>("server_id").map_err(map_sqlx)? as u64,
        connector_id: row.try_get::<i64, _>("connector_id").map_err(map_sqlx)? as u64,
        prompt_key: row.try_get("prompt_key").map_err(map_sqlx)?,
        name: row.try_get("name").map_err(map_sqlx)?,
        description: row.try_get("description").map_err(map_sqlx)?,
        arguments_schema_json: read_json_string(row, "arguments_schema_json")?,
        enabled: row.try_get("enabled").map_err(map_sqlx)?,
        lifecycle_status: map_lifecycle(row.try_get("lifecycle_status").map_err(map_sqlx)?)?,
        discovered_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("discovered_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
        version: row.try_get::<i64, _>("version").map_err(map_sqlx)? as u64,
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
        updated_at: timestamp_to_rfc3339(row.try_get("updated_at").map_err(map_sqlx)?),
        created_by: row.try_get::<i64, _>("created_by").map_err(map_sqlx)? as u64,
        updated_by: row.try_get::<i64, _>("updated_by").map_err(map_sqlx)? as u64,
        deleted_at: row
            .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("deleted_at")
            .map_err(map_sqlx)?
            .map(timestamp_to_rfc3339),
    })
}

fn row_to_invocation(row: &sqlx::postgres::PgRow) -> McpResult<McpInvocationRecord> {
    Ok(McpInvocationRecord {
        id: row.try_get::<i64, _>("id").map_err(map_sqlx)? as u64,
        uuid: row.try_get("uuid").map_err(map_sqlx)?,
        tenant_id: row.try_get::<i64, _>("tenant_id").map_err(map_sqlx)? as u64,
        organization_id: row.try_get::<i64, _>("organization_id").map_err(map_sqlx)? as u64,
        user_id: row.try_get::<i64, _>("user_id").map_err(map_sqlx)? as u64,
        server_id: row.try_get::<i64, _>("server_id").map_err(map_sqlx)? as u64,
        connector_id: row
            .try_get::<Option<i64>, _>("connector_id")
            .map_err(map_sqlx)?
            .map(|value| value as u64),
        invocation_kind: map_invocation_kind(
            row.try_get::<String, _>("invocation_kind")
                .map_err(map_sqlx)?
                .as_str(),
        )?,
        target_key: row.try_get("target_key").map_err(map_sqlx)?,
        request_id: row.try_get("request_id").map_err(map_sqlx)?,
        trace_id: row.try_get("trace_id").map_err(map_sqlx)?,
        idempotency_key: row.try_get("idempotency_key").map_err(map_sqlx)?,
        request_json: read_json_string(row, "request_json")?,
        response_json: read_optional_json_string(row, "response_json")?,
        status: row.try_get("status").map_err(map_sqlx)?,
        error_message: row.try_get("error_message").map_err(map_sqlx)?,
        duration_ms: row
            .try_get::<Option<i32>, _>("duration_ms")
            .map_err(map_sqlx)?
            .map(|value| value as u32),
        invoked_at: timestamp_to_rfc3339(row.try_get("invoked_at").map_err(map_sqlx)?),
        created_at: timestamp_to_rfc3339(row.try_get("created_at").map_err(map_sqlx)?),
    })
}

pub async fn list_categories(
    pool: &PgPool,
    tenant_id: u64,
) -> McpResult<Vec<McpServerCategoryRecord>> {
    let query = format!(
        r#"
        SELECT {CATEGORY_SELECT}
        FROM ai_mcp_server_category
        WHERE tenant_id IN (0, $1) AND {ACTIVE_ENTITY_FILTER}
        ORDER BY sort_order ASC, category_code ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_category).collect()
}

/// Catalog-visible categories: only `active` rows, in registry order.
///
/// Mirrors [`list_catalog_servers`] on the same table family: the marketplace
/// offers the taxonomy a visitor can file against, while draft, disabled and
/// archived categories stay admin-only through [`ACTIVE_ENTITY_FILTER`].
pub async fn list_catalog_categories(
    pool: &PgPool,
    tenant_id: u64,
) -> McpResult<Vec<McpServerCategoryRecord>> {
    let query = format!(
        r#"
        SELECT {CATEGORY_SELECT}
        FROM ai_mcp_server_category
        WHERE tenant_id IN (0, $1) AND {CATALOG_VISIBLE_FILTER}
        ORDER BY sort_order ASC, category_code ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_category).collect()
}

/// Admin category page: the store applies the category selector, the keyword
/// and the page window, and returns the filtered total with the rows.
pub async fn list_categories_page(
    pool: &PgPool,
    tenant_id: u64,
    filter: &CatalogViewFilter,
    keyword: Option<&str>,
    limit: i64,
    offset: i64,
) -> McpResult<(Vec<McpServerCategoryRecord>, i64)> {
    let rows = sqlx::query(CATEGORY_PAGE_SQL)
        .bind(tenant_id as i64)
        .bind(filter.category_code())
        .bind(keyword_like_pattern(keyword))
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    let (items, mut total) = map_page(rows, row_to_category)?;
    if items.is_empty() && offset > 0 {
        total = sqlx::query(CATEGORY_PAGE_SQL)
            .bind(tenant_id as i64)
            .bind(filter.category_code())
            .bind(keyword_like_pattern(keyword))
            .bind(1_i64)
            .bind(0_i64)
            .fetch_optional(pool)
            .await
            .map_err(map_sqlx)?
            .map(|row| row.try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN))
            .transpose()
            .map_err(map_sqlx)?
            .unwrap_or(0);
    }
    Ok((items, total))
}

/// Catalog-visible category page: same filters and window, restricted to the
/// marketplace taxonomy by [`CATALOG_VISIBLE_FILTER`].
pub async fn list_catalog_categories_page(
    pool: &PgPool,
    tenant_id: u64,
    filter: &CatalogViewFilter,
    keyword: Option<&str>,
    limit: i64,
    offset: i64,
) -> McpResult<(Vec<McpServerCategoryRecord>, i64)> {
    let rows = sqlx::query(CATALOG_CATEGORY_PAGE_SQL)
        .bind(tenant_id as i64)
        .bind(filter.category_code())
        .bind(keyword_like_pattern(keyword))
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    let (items, mut total) = map_page(rows, row_to_category)?;
    if items.is_empty() && offset > 0 {
        total = sqlx::query(CATALOG_CATEGORY_PAGE_SQL)
            .bind(tenant_id as i64)
            .bind(filter.category_code())
            .bind(keyword_like_pattern(keyword))
            .bind(1_i64)
            .bind(0_i64)
            .fetch_optional(pool)
            .await
            .map_err(map_sqlx)?
            .map(|row| row.try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN))
            .transpose()
            .map_err(map_sqlx)?
            .unwrap_or(0);
    }
    Ok((items, total))
}

pub async fn get_category(
    pool: &PgPool,
    tenant_id: u64,
    category_code: &str,
) -> McpResult<McpServerCategoryRecord> {
    let query = format!(
        r#"
        SELECT {CATEGORY_SELECT}
        FROM ai_mcp_server_category
        WHERE tenant_id = $1 AND category_code = $2 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(category_code)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_category)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(category_code.to_string()))
}

pub async fn upsert_category(
    pool: &PgPool,
    record: McpServerCategoryRecord,
) -> McpResult<McpServerCategoryRecord> {
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let query = format!(
        r#"
        INSERT INTO ai_mcp_server_category (
            id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
            sort_order, icon_ref, lifecycle_status, version, created_by, updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (tenant_id, category_code) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            parent_id = EXCLUDED.parent_id,
            sort_order = EXCLUDED.sort_order,
            icon_ref = EXCLUDED.icon_ref,
            lifecycle_status = EXCLUDED.lifecycle_status,
            version = ai_mcp_server_category.version + 1,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL
        RETURNING {CATEGORY_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(&record.category_code)
        .bind(&record.name)
        .bind(&record.description)
        .bind(record.parent_id as i64)
        .bind(record.sort_order)
        .bind(&record.icon_ref)
        .bind(record.lifecycle_status.as_db_code())
        .bind(record.version as i64)
        .bind(record.created_by as i64)
        .bind(record.updated_by as i64)
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_category(&row)
}

pub async fn delete_category(
    pool: &PgPool,
    tenant_id: u64,
    category_code: &str,
) -> McpResult<McpServerCategoryRecord> {
    let query = format!(
        r#"
        UPDATE ai_mcp_server_category
        SET lifecycle_status = 4, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND category_code = $2 AND deleted_at IS NULL
        RETURNING {CATEGORY_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(category_code)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_category)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(category_code.to_string()))
}

pub async fn list_servers(pool: &PgPool, tenant_id: u64) -> McpResult<Vec<McpServerRecord>> {
    let query = format!(
        r#"
        SELECT {SERVER_SELECT}
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND {ACTIVE_ENTITY_FILTER}
        ORDER BY updated_at DESC, server_key ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_server).collect()
}

/// Catalog-visible servers for one caller: the lifecycle gate plus the
/// visibility scope (see [`catalog_visibility_scope`]).
///
/// `$1` is the tenant, `$2` the caller's organization id and `$3` the caller's
/// user id.
pub async fn list_catalog_servers(
    pool: &PgPool,
    tenant_id: u64,
    organization_id: u64,
    user_id: u64,
) -> McpResult<Vec<McpServerRecord>> {
    let query = format!(
        r#"
        SELECT {SERVER_SELECT}
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND {CATALOG_VISIBLE_FILTER}
          AND {}
        ORDER BY updated_at DESC, server_key ASC
        "#,
        catalog_visibility_scope("$2", "$3")
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(organization_id as i64)
        .bind(user_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_server).collect()
}

/// Admin server page: the store applies the catalog view, the keyword and the
/// page window, and returns the filtered total with the rows.
pub async fn list_servers_page(
    pool: &PgPool,
    tenant_id: u64,
    filter: &CatalogViewFilter,
    keyword: Option<&str>,
    limit: i64,
    offset: i64,
) -> McpResult<(Vec<McpServerRecord>, i64)> {
    let rows = sqlx::query(SERVER_PAGE_SQL)
        .bind(tenant_id as i64)
        .bind(filter.category_code())
        .bind(filter.role_codes().to_vec())
        .bind(keyword_like_pattern(keyword))
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    let (items, mut total) = map_page(rows, row_to_server)?;
    if items.is_empty() && offset > 0 {
        total = sqlx::query(SERVER_PAGE_SQL)
            .bind(tenant_id as i64)
            .bind(filter.category_code())
            .bind(filter.role_codes().to_vec())
            .bind(keyword_like_pattern(keyword))
            .bind(1_i64)
            .bind(0_i64)
            .fetch_optional(pool)
            .await
            .map_err(map_sqlx)?
            .map(|row| row.try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN))
            .transpose()
            .map_err(map_sqlx)?
            .unwrap_or(0);
    }
    Ok((items, total))
}

/// Catalog-visible server page: same filters and window, restricted to
/// [`CATALOG_VISIBLE_FILTER`] and the caller's visibility scope.
pub async fn list_catalog_servers_page(
    pool: &PgPool,
    tenant_id: u64,
    organization_id: u64,
    user_id: u64,
    filter: &CatalogViewFilter,
    keyword: Option<&str>,
    limit: i64,
    offset: i64,
) -> McpResult<(Vec<McpServerRecord>, i64)> {
    let rows = sqlx::query(CATALOG_SERVER_PAGE_SQL)
        .bind(tenant_id as i64)
        .bind(organization_id as i64)
        .bind(user_id as i64)
        .bind(filter.category_code())
        .bind(filter.role_codes().to_vec())
        .bind(keyword_like_pattern(keyword))
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    let (items, mut total) = map_page(rows, row_to_server)?;
    if items.is_empty() && offset > 0 {
        total = sqlx::query(CATALOG_SERVER_PAGE_SQL)
            .bind(tenant_id as i64)
            .bind(organization_id as i64)
            .bind(user_id as i64)
            .bind(filter.category_code())
            .bind(filter.role_codes().to_vec())
            .bind(keyword_like_pattern(keyword))
            .bind(1_i64)
            .bind(0_i64)
            .fetch_optional(pool)
            .await
            .map_err(map_sqlx)?
            .map(|row| row.try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN))
            .transpose()
            .map_err(map_sqlx)?
            .unwrap_or(0);
    }
    Ok((items, total))
}

pub async fn list_owned_servers(
    pool: &PgPool,
    tenant_id: u64,
    owner_user_id: u64,
) -> McpResult<Vec<McpServerRecord>> {
    let query = format!(
        r#"
        SELECT {SERVER_SELECT}
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND owner_user_id = $2 AND {ACTIVE_ENTITY_FILTER}
        ORDER BY updated_at DESC, server_key ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(owner_user_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_server).collect()
}

pub async fn get_server(
    pool: &PgPool,
    tenant_id: u64,
    server_key: &str,
) -> McpResult<McpServerRecord> {
    let query = format!(
        r#"
        SELECT {SERVER_SELECT}
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND server_key = $2 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_server)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(server_key.to_string()))
}

/// Catalog-visible server lookup by key, scoped like the catalog list.
///
/// Unlike [`get_server`], a row the caller's visibility scope hides, a draft or
/// a disabled server is reported as `None` instead of leaking it through a
/// guessed key.
pub async fn get_catalog_server(
    pool: &PgPool,
    tenant_id: u64,
    organization_id: u64,
    user_id: u64,
    server_key: &str,
) -> McpResult<Option<McpServerRecord>> {
    let query = catalog_server_get_sql();
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(organization_id as i64)
        .bind(user_id as i64)
        .bind(server_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref().map(row_to_server).transpose()
}

/// True when `server_id` is catalog-visible to the caller.
///
/// The read mirrors [`get_catalog_server`] by id, so the parent check of an
/// app-facing sub-resource operation applies the same lifecycle gate and
/// visibility scope as the catalog list. Admin reads keep using
/// [`get_server_by_id`], which stays unscoped on purpose.
pub async fn catalog_server_exists(
    pool: &PgPool,
    tenant_id: u64,
    organization_id: u64,
    user_id: u64,
    server_id: u64,
) -> McpResult<bool> {
    let query = catalog_server_exists_sql();
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(organization_id as i64)
        .bind(user_id as i64)
        .bind(server_id as i64)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    Ok(row.is_some())
}

pub async fn get_server_by_id(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
) -> McpResult<McpServerRecord> {
    let query = format!(
        r#"
        SELECT {SERVER_SELECT}
        FROM ai_mcp_server
        WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_server)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(format!("mcp server {server_id}")))
}

pub async fn upsert_server(pool: &PgPool, record: McpServerRecord) -> McpResult<McpServerRecord> {
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let tags_json = bind_json_string(&string_list_to_json(&record.tags, "tags")?, "tags_json")?;
    let allowed_role_codes = bind_json_string(
        &string_list_to_json(&record.allowed_role_codes, "allowed_role_codes")?,
        "allowed_role_codes",
    )?;
    let query = format!(
        r#"
        INSERT INTO ai_mcp_server (
            id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
            category_id, category_code, transport, visibility, data_scope, latest_connector_id,
            published_connector_id, health_status, lifecycle_status, tags_json,
            allowed_role_codes, icon_ref, version, created_by, updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23
        )
        ON CONFLICT (tenant_id, server_key) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            owner_user_id = EXCLUDED.owner_user_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            category_code = EXCLUDED.category_code,
            transport = EXCLUDED.transport,
            visibility = EXCLUDED.visibility,
            data_scope = EXCLUDED.data_scope,
            latest_connector_id = EXCLUDED.latest_connector_id,
            published_connector_id = EXCLUDED.published_connector_id,
            health_status = EXCLUDED.health_status,
            lifecycle_status = EXCLUDED.lifecycle_status,
            tags_json = EXCLUDED.tags_json,
            allowed_role_codes = EXCLUDED.allowed_role_codes,
            icon_ref = EXCLUDED.icon_ref,
            version = ai_mcp_server.version + 1,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL
        RETURNING {SERVER_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(record.owner_user_id as i64)
        .bind(&record.server_key)
        .bind(&record.name)
        .bind(&record.description)
        .bind(record.category_id.map(|value| value as i64))
        .bind(&record.category_code)
        .bind(record.transport.as_str())
        .bind(record.visibility.as_str())
        .bind(record.data_scope.as_db_code())
        .bind(record.latest_connector_id.map(|value| value as i64))
        .bind(record.published_connector_id.map(|value| value as i64))
        .bind(record.health_status.as_str())
        .bind(record.lifecycle_status.as_db_code())
        .bind(tags_json)
        .bind(allowed_role_codes)
        .bind(&record.icon_ref)
        .bind(record.version as i64)
        .bind(record.created_by as i64)
        .bind(record.updated_by as i64)
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_server(&row)
}

pub async fn delete_server(
    pool: &PgPool,
    tenant_id: u64,
    server_key: &str,
) -> McpResult<McpServerRecord> {
    let query = format!(
        r#"
        UPDATE ai_mcp_server
        SET lifecycle_status = 4, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND server_key = $2 AND deleted_at IS NULL
        RETURNING {SERVER_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_server)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(server_key.to_string()))
}

pub async fn list_connectors(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
) -> McpResult<Vec<McpConnectorRecord>> {
    let query = format!(
        r#"
        SELECT {CONNECTOR_SELECT}
        FROM ai_mcp_connector
        WHERE tenant_id = $1 AND server_id = $2 AND {ACTIVE_ENTITY_FILTER}
        ORDER BY updated_at DESC, connector_key ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_connector).collect()
}

pub async fn get_connector(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    connector_key: &str,
) -> McpResult<McpConnectorRecord> {
    let query = format!(
        r#"
        SELECT {CONNECTOR_SELECT}
        FROM ai_mcp_connector
        WHERE tenant_id = $1 AND server_id = $2 AND connector_key = $3 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(connector_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_connector)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(connector_key.to_string()))
}

pub async fn upsert_connector(
    pool: &PgPool,
    record: McpConnectorRecord,
) -> McpResult<McpConnectorRecord> {
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let args_json = bind_json_string(&record.args_json, "args_json")?;
    let env_schema_json = bind_json_string(&record.env_schema_json, "env_schema_json")?;
    let retry_policy_json = bind_json_string(&record.retry_policy_json, "retry_policy_json")?;
    let query = format!(
        r#"
        INSERT INTO ai_mcp_connector (
            id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
            transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
            secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
            created_by, updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21
        )
        ON CONFLICT (tenant_id, server_id, connector_key) DO UPDATE SET
            publish_status = EXCLUDED.publish_status,
            transport = EXCLUDED.transport,
            endpoint_url = EXCLUDED.endpoint_url,
            command_ref = EXCLUDED.command_ref,
            args_json = EXCLUDED.args_json,
            env_schema_json = EXCLUDED.env_schema_json,
            auth_type = EXCLUDED.auth_type,
            secret_ref = EXCLUDED.secret_ref,
            timeout_ms = EXCLUDED.timeout_ms,
            retry_policy_json = EXCLUDED.retry_policy_json,
            config_hash = EXCLUDED.config_hash,
            lifecycle_status = EXCLUDED.lifecycle_status,
            version = ai_mcp_connector.version + 1,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL
        RETURNING {CONNECTOR_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(record.server_id as i64)
        .bind(&record.connector_key)
        .bind(record.publish_status.as_str())
        .bind(record.transport.as_str())
        .bind(&record.endpoint_url)
        .bind(&record.command_ref)
        .bind(args_json)
        .bind(env_schema_json)
        .bind(record.auth_type.as_str())
        .bind(&record.secret_ref)
        .bind(record.timeout_ms as i32)
        .bind(retry_policy_json)
        .bind(&record.config_hash)
        .bind(record.lifecycle_status.as_db_code())
        .bind(record.version as i64)
        .bind(record.created_by as i64)
        .bind(record.updated_by as i64)
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_connector(&row)
}

pub async fn delete_connector(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    connector_key: &str,
) -> McpResult<McpConnectorRecord> {
    let query = format!(
        r#"
        UPDATE ai_mcp_connector
        SET lifecycle_status = 4, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND server_id = $2 AND connector_key = $3 AND deleted_at IS NULL
        RETURNING {CONNECTOR_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(connector_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_connector)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(connector_key.to_string()))
}

pub async fn list_tools(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
) -> McpResult<Vec<McpToolRecord>> {
    let query = format!(
        r#"
        SELECT {TOOL_SELECT}
        FROM ai_mcp_tool
        WHERE tenant_id = $1 AND server_id = $2 AND deleted_at IS NULL AND enabled = TRUE
        ORDER BY sort_weight ASC, tool_key ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_tool).collect()
}

pub async fn get_tool(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    tool_key: &str,
) -> McpResult<McpToolRecord> {
    let query = format!(
        r#"
        SELECT {TOOL_SELECT}
        FROM ai_mcp_tool
        WHERE tenant_id = $1 AND server_id = $2 AND tool_key = $3 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(tool_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_tool)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(tool_key.to_string()))
}

pub async fn upsert_tool(pool: &PgPool, record: McpToolRecord) -> McpResult<McpToolRecord> {
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let input_schema_json = bind_json_string(&record.input_schema_json, "input_schema_json")?;
    let output_schema_json = bind_json_string(&record.output_schema_json, "output_schema_json")?;
    let rate_limit_policy_json =
        bind_json_string(&record.rate_limit_policy_json, "rate_limit_policy_json")?;
    let query = format!(
        r#"
        INSERT INTO ai_mcp_tool (
            id, uuid, tenant_id, organization_id, server_id, connector_id, tool_key, name,
            description, input_schema_json, output_schema_json, risk_level, requires_approval,
            enabled, lifecycle_status, rate_limit_policy_json, schema_hash, sort_weight, version,
            created_by, updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21
        )
        ON CONFLICT (tenant_id, server_id, tool_key) DO UPDATE SET
            connector_id = EXCLUDED.connector_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            input_schema_json = EXCLUDED.input_schema_json,
            output_schema_json = EXCLUDED.output_schema_json,
            risk_level = EXCLUDED.risk_level,
            requires_approval = EXCLUDED.requires_approval,
            enabled = EXCLUDED.enabled,
            lifecycle_status = EXCLUDED.lifecycle_status,
            rate_limit_policy_json = EXCLUDED.rate_limit_policy_json,
            schema_hash = EXCLUDED.schema_hash,
            sort_weight = EXCLUDED.sort_weight,
            version = ai_mcp_tool.version + 1,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL
        RETURNING {TOOL_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(record.server_id as i64)
        .bind(record.connector_id as i64)
        .bind(&record.tool_key)
        .bind(&record.name)
        .bind(&record.description)
        .bind(input_schema_json)
        .bind(output_schema_json)
        .bind(&record.risk_level)
        .bind(record.requires_approval)
        .bind(record.enabled)
        .bind(record.lifecycle_status.as_db_code())
        .bind(rate_limit_policy_json)
        .bind(&record.schema_hash)
        .bind(record.sort_weight)
        .bind(record.version as i64)
        .bind(record.created_by as i64)
        .bind(record.updated_by as i64)
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_tool(&row)
}

pub async fn delete_tool(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    tool_key: &str,
) -> McpResult<McpToolRecord> {
    let query = format!(
        r#"
        UPDATE ai_mcp_tool
        SET lifecycle_status = 4, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND server_id = $2 AND tool_key = $3 AND deleted_at IS NULL
        RETURNING {TOOL_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(tool_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_tool)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(tool_key.to_string()))
}

pub async fn list_resources(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
) -> McpResult<Vec<McpResourceRecord>> {
    let query = format!(
        r#"
        SELECT {RESOURCE_SELECT}
        FROM ai_mcp_resource
        WHERE tenant_id = $1 AND server_id = $2 AND deleted_at IS NULL AND enabled = TRUE
        ORDER BY resource_key ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_resource).collect()
}

pub async fn get_resource(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    resource_key: &str,
) -> McpResult<McpResourceRecord> {
    let query = format!(
        r#"
        SELECT {RESOURCE_SELECT}
        FROM ai_mcp_resource
        WHERE tenant_id = $1 AND server_id = $2 AND resource_key = $3 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(resource_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_resource)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(resource_key.to_string()))
}

pub async fn upsert_resource(
    pool: &PgPool,
    record: McpResourceRecord,
) -> McpResult<McpResourceRecord> {
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let query = format!(
        r#"
        INSERT INTO ai_mcp_resource (
            id, uuid, tenant_id, organization_id, server_id, connector_id, resource_key, uri,
            name, description, mime_type, enabled, lifecycle_status, version, created_by,
            updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (tenant_id, server_id, resource_key) DO UPDATE SET
            connector_id = EXCLUDED.connector_id,
            uri = EXCLUDED.uri,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            mime_type = EXCLUDED.mime_type,
            enabled = EXCLUDED.enabled,
            lifecycle_status = EXCLUDED.lifecycle_status,
            version = ai_mcp_resource.version + 1,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL
        RETURNING {RESOURCE_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(record.server_id as i64)
        .bind(record.connector_id as i64)
        .bind(&record.resource_key)
        .bind(&record.uri)
        .bind(&record.name)
        .bind(&record.description)
        .bind(&record.mime_type)
        .bind(record.enabled)
        .bind(record.lifecycle_status.as_db_code())
        .bind(record.version as i64)
        .bind(record.created_by as i64)
        .bind(record.updated_by as i64)
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_resource(&row)
}

pub async fn delete_resource(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    resource_key: &str,
) -> McpResult<McpResourceRecord> {
    let query = format!(
        r#"
        UPDATE ai_mcp_resource
        SET lifecycle_status = 4, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND server_id = $2 AND resource_key = $3 AND deleted_at IS NULL
        RETURNING {RESOURCE_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(resource_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_resource)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(resource_key.to_string()))
}

pub async fn list_prompts(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
) -> McpResult<Vec<McpPromptRecord>> {
    let query = format!(
        r#"
        SELECT {PROMPT_SELECT}
        FROM ai_mcp_prompt
        WHERE tenant_id = $1 AND server_id = $2 AND deleted_at IS NULL AND enabled = TRUE
        ORDER BY prompt_key ASC
        "#
    );
    let rows = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    rows.iter().map(row_to_prompt).collect()
}

pub async fn get_prompt(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    prompt_key: &str,
) -> McpResult<McpPromptRecord> {
    let query = format!(
        r#"
        SELECT {PROMPT_SELECT}
        FROM ai_mcp_prompt
        WHERE tenant_id = $1 AND server_id = $2 AND prompt_key = $3 AND deleted_at IS NULL
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(prompt_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_prompt)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(prompt_key.to_string()))
}

pub async fn upsert_prompt(pool: &PgPool, record: McpPromptRecord) -> McpResult<McpPromptRecord> {
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let arguments_schema_json =
        bind_json_string(&record.arguments_schema_json, "arguments_schema_json")?;
    let query = format!(
        r#"
        INSERT INTO ai_mcp_prompt (
            id, uuid, tenant_id, organization_id, server_id, connector_id, prompt_key, name,
            description, arguments_schema_json, enabled, lifecycle_status, version, created_by,
            updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (tenant_id, server_id, prompt_key) DO UPDATE SET
            connector_id = EXCLUDED.connector_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            arguments_schema_json = EXCLUDED.arguments_schema_json,
            enabled = EXCLUDED.enabled,
            lifecycle_status = EXCLUDED.lifecycle_status,
            version = ai_mcp_prompt.version + 1,
            updated_by = EXCLUDED.updated_by,
            updated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL
        RETURNING {PROMPT_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(record.server_id as i64)
        .bind(record.connector_id as i64)
        .bind(&record.prompt_key)
        .bind(&record.name)
        .bind(&record.description)
        .bind(arguments_schema_json)
        .bind(record.enabled)
        .bind(record.lifecycle_status.as_db_code())
        .bind(record.version as i64)
        .bind(record.created_by as i64)
        .bind(record.updated_by as i64)
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_prompt(&row)
}

pub async fn delete_prompt(
    pool: &PgPool,
    tenant_id: u64,
    server_id: u64,
    prompt_key: &str,
) -> McpResult<McpPromptRecord> {
    let query = format!(
        r#"
        UPDATE ai_mcp_prompt
        SET lifecycle_status = 4, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND server_id = $2 AND prompt_key = $3 AND deleted_at IS NULL
        RETURNING {PROMPT_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(server_id as i64)
        .bind(prompt_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref()
        .map(row_to_prompt)
        .transpose()?
        .ok_or_else(|| McpServiceError::NotFound(prompt_key.to_string()))
}

/// Invocation page filtered and windowed by the store, returning the rows with
/// the filtered total.
///
/// `server_id` narrows to one server, `user_id` narrows to that owner (the
/// application surface binds the caller; the backend passes `None` for the
/// tenant-wide admin view) and `search` matches `target_key` (`ILIKE`, escaped
/// literal substring). A page past the end re-reads the first row of the same
/// filters so `pageInfo.totalItems` never depends on the requested page.
pub async fn list_invocations(
    pool: &PgPool,
    tenant_id: u64,
    server_id: Option<u64>,
    user_id: Option<u64>,
    search: Option<&str>,
    limit: i64,
    offset: i64,
) -> McpResult<(Vec<McpInvocationRecord>, i64)> {
    let server_id = server_id.map(|value| value as i64);
    let user_id = user_id.map(|value| value as i64);
    let keyword = keyword_like_pattern(search);
    let rows = sqlx::query(INVOCATION_PAGE_SQL)
        .bind(tenant_id as i64)
        .bind(server_id)
        .bind(user_id)
        .bind(keyword.clone())
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(map_sqlx)?;
    let (items, mut total) = map_page(rows, row_to_invocation)?;
    if items.is_empty() && offset > 0 {
        total = sqlx::query(INVOCATION_PAGE_SQL)
            .bind(tenant_id as i64)
            .bind(server_id)
            .bind(user_id)
            .bind(keyword)
            .bind(1_i64)
            .bind(0_i64)
            .fetch_optional(pool)
            .await
            .map_err(map_sqlx)?
            .map(|row| row.try_get::<i64, _>(LIST_TOTAL_SQL_COLUMN))
            .transpose()
            .map_err(map_sqlx)?
            .unwrap_or(0);
    }
    Ok((items, total))
}

pub async fn get_invocation_by_idempotency(
    pool: &PgPool,
    tenant_id: u64,
    idempotency_key: &str,
) -> McpResult<Option<McpInvocationRecord>> {
    let query = format!(
        r#"
        SELECT {INVOCATION_SELECT}
        FROM ai_mcp_invocation_log
        WHERE tenant_id = $1 AND idempotency_key = $2
        LIMIT 1
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(tenant_id as i64)
        .bind(idempotency_key)
        .fetch_optional(pool)
        .await
        .map_err(map_sqlx)?;
    row.as_ref().map(row_to_invocation).transpose()
}

pub async fn append_invocation(
    pool: &PgPool,
    record: McpInvocationRecord,
) -> McpResult<McpInvocationRecord> {
    if let Some(key) = record
        .idempotency_key
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        if let Some(existing) = get_invocation_by_idempotency(pool, record.tenant_id, key).await? {
            return Ok(existing);
        }
    }
    let id = resolve_entity_id(record.id);
    let uuid = resolve_entity_uuid(&record.uuid);
    let request_json = bind_json_string(&record.request_json, "request_json")?;
    let response_json = bind_optional_json_string(&record.response_json, "response_json")?;
    let query = format!(
        r#"
        INSERT INTO ai_mcp_invocation_log (
            id, uuid, tenant_id, organization_id, user_id, server_id, connector_id,
            invocation_kind, target_key, request_id, trace_id, idempotency_key, request_json,
            response_json, status, error_message, duration_ms
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING {INVOCATION_SELECT}
        "#
    );
    let row = sqlx::query(sqlx::AssertSqlSafe(query.as_str()))
        .bind(id)
        .bind(uuid)
        .bind(record.tenant_id as i64)
        .bind(record.organization_id as i64)
        .bind(record.user_id as i64)
        .bind(record.server_id as i64)
        .bind(record.connector_id.map(|value| value as i64))
        .bind(record.invocation_kind.as_str())
        .bind(&record.target_key)
        .bind(&record.request_id)
        .bind(&record.trace_id)
        .bind(&record.idempotency_key)
        .bind(request_json)
        .bind(response_json)
        .bind(&record.status)
        .bind(&record.error_message)
        .bind(record.duration_ms.map(|value| value as i32))
        .fetch_one(pool)
        .await
        .map_err(map_sqlx)?;
    row_to_invocation(&row)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn normalized(sql: &str) -> String {
        sql.split_whitespace().collect::<Vec<_>>().join(" ")
    }

    /// The catalog filter is a literal SQL clause, so it is pinned to the
    /// contract's active lifecycle code to keep the two in step.
    #[test]
    fn catalog_visibility_selects_active_rows_only() {
        let expected = format!(
            "deleted_at IS NULL AND lifecycle_status = {}",
            McpLifecycleStatus::Active.as_db_code()
        );
        assert_eq!(CATALOG_VISIBLE_FILTER, expected);
        assert_ne!(ACTIVE_ENTITY_FILTER, CATALOG_VISIBLE_FILTER);
    }

    /// Both category listings read the same table; the pair of predicates is
    /// what keeps the marketplace taxonomy active-only while the admin still
    /// sees drafts. Pinning the split here keeps a later edit from collapsing
    /// the two callers back onto one predicate.
    #[test]
    fn category_listings_keep_the_catalog_admin_split() {
        let catalog = format!(
            "FROM ai_mcp_server_category\n        WHERE tenant_id IN (0, $1) AND {CATALOG_VISIBLE_FILTER}"
        );
        let admin = format!(
            "FROM ai_mcp_server_category\n        WHERE tenant_id IN (0, $1) AND {ACTIVE_ENTITY_FILTER}"
        );
        assert!(catalog.contains("lifecycle_status = 1"));
        assert!(admin.contains("lifecycle_status <> 4"));
        assert_ne!(catalog, admin);
    }

    /// Every catalog read of `ai_mcp_server` shares one visibility rule: rows
    /// scoped to `tenant`/`public`, rows scoped to the caller's organization and
    /// rows scoped to the owner. Pinning the helper output keeps a later edit
    /// from rewording the rule in only one of the catalog statements.
    #[test]
    fn catalog_visibility_scope_has_three_branches() {
        let predicate = catalog_visibility_scope("$7", "$8");
        assert!(predicate.contains("(visibility IN ('tenant', 'public')"));
        assert!(predicate.contains("(visibility = 'organization' AND organization_id = $7)"));
        assert!(predicate.contains("(visibility = 'private' AND owner_user_id = $8)"));
    }

    /// The catalog server page scopes visibility to the caller, while the admin
    /// page stays tenant-wide on purpose: a mis-scoped row is exactly what an
    /// admin needs to see.
    #[test]
    fn catalog_server_page_scopes_visibility_to_the_caller() {
        let page = normalized(CATALOG_SERVER_PAGE_SQL);
        assert!(page.contains(&normalized(&catalog_visibility_scope("$2", "$3"))));
        assert!(page.contains("organization_id = $2"));
        assert!(page.contains("owner_user_id = $3"));

        let admin = normalized(SERVER_PAGE_SQL);
        assert!(!admin.contains("visibility IN ('tenant', 'public')"));
        assert!(!admin.contains("visibility = 'organization'"));
        assert!(!admin.contains("visibility = 'private'"));
    }

    /// The by-key catalog read has to use the same lifecycle gate and scope as
    /// the catalog list, otherwise a guessed `server_key` bypasses the list.
    #[test]
    fn catalog_server_get_scopes_visibility_to_the_caller() {
        let get = normalized(&catalog_server_get_sql());
        assert!(get.contains(&normalized(&catalog_visibility_scope("$2", "$3"))));
        assert!(get.contains(&normalized(CATALOG_VISIBLE_FILTER)));
        assert!(get.contains("tenant_id = $1"));
        assert!(get.contains("organization_id = $2"));
        assert!(get.contains("owner_user_id = $3"));
        assert!(get.contains("server_key = $4"));
        assert!(get.contains(&normalized(SERVER_SELECT)));
    }

    /// The by-id parent guard of the app-facing sub-resource reads has to carry
    /// the same three-branch visibility predicate and lifecycle gate as the
    /// by-key catalog read, on the same bind parameters, or a known
    /// `server_id` reaches the tools/resources/prompts of a hidden server.
    #[test]
    fn catalog_server_exists_scopes_visibility_to_the_caller() {
        let exists = normalized(&catalog_server_exists_sql());
        let get = normalized(&catalog_server_get_sql());
        let scope = normalized(&catalog_visibility_scope("$2", "$3"));

        for statement in [&exists, &get] {
            assert!(statement.contains(&scope));
            assert!(statement.contains(&normalized(CATALOG_VISIBLE_FILTER)));
            assert!(!statement.contains(&normalized(ACTIVE_ENTITY_FILTER)));
            assert!(statement.contains("tenant_id = $1"));
            assert!(statement.contains("organization_id = $2"));
            assert!(statement.contains("owner_user_id = $3"));
        }

        assert!(exists.contains("SELECT 1"));
        assert!(exists.contains("id = $4"));
        assert!(get.contains("server_key = $4"));
        assert!(get.contains(&normalized(SERVER_SELECT)));
    }

    /// The paged listings must push the page window and the filtered total
    /// into the store: `COUNT(*) OVER()` after the predicates, then
    /// `LIMIT`/`OFFSET`. Selecting every row and slicing it in memory is the
    /// contract violation this pins against.
    ///
    /// The catalog page inserts the caller scope as `$2`/`$3`, so its filter
    /// and window parameters shift by two relative to the admin page.
    #[test]
    fn paged_server_queries_count_filter_and_window_in_the_store() {
        for (sql, window, category, roles, keyword) in [
            (SERVER_PAGE_SQL, "LIMIT $5 OFFSET $6", "$2", "$3", "$4"),
            (
                CATALOG_SERVER_PAGE_SQL,
                "LIMIT $7 OFFSET $8",
                "$4",
                "$5",
                "$6",
            ),
        ] {
            assert!(sql.contains("COUNT(*) OVER()"));
            assert!(sql.contains(LIST_TOTAL_SQL_COLUMN));
            assert!(sql.contains(window));
            assert!(sql.contains(&format!("LOWER(category_code) = {category}")));
            assert!(sql.contains(&format!("cardinality({roles}::text[]) = 0")));
            assert!(sql.contains("jsonb_array_length(allowed_role_codes) = 0"));
            assert!(sql.contains(&format!("allowed_role_codes ?| {roles}::text[]")));
            assert!(sql.contains(&format!("LOWER(server_key) LIKE {keyword}")));
            assert!(sql.contains(&format!("LOWER(name) LIKE {keyword}")));
            assert!(sql.contains(&format!("LOWER(COALESCE(description, '')) LIKE {keyword}")));
            assert!(sql.contains(&format!("LOWER(tags_json::text) LIKE {keyword}")));
            assert!(normalized(sql).contains(&normalized(SERVER_SELECT)));
        }
    }

    /// The invocation list must be one static statement whose nullable binds
    /// express the `server_id`, owner `user_id` and keyword filters, so the
    /// store owns filtering, the page window and the filtered total. Four
    /// hand-written variants (and a separate count query) are exactly the
    /// duplication that let `pageInfo` describe something other than the
    /// filtered set.
    ///
    /// The exact clause is pinned so the bind order cannot drift: `$1` tenant,
    /// `$2` optional server, `$3` optional owner, `$4` optional keyword,
    /// `$5`/`$6` the page window.
    #[test]
    fn paged_invocation_query_counts_filters_and_windows_in_the_store() {
        let sql = normalized(INVOCATION_PAGE_SQL);
        assert!(sql.contains("COUNT(*) OVER()"));
        assert!(sql.contains(LIST_TOTAL_SQL_COLUMN));
        assert!(sql.contains(&normalized(INVOCATION_SELECT)));
        assert_eq!(
            sql.matches("FROM ai_mcp_invocation_log").count(),
            1,
            "the invocation page must be one static statement"
        );
        assert!(sql.contains(&normalized(
            "WHERE tenant_id = $1
             AND ($2::bigint IS NULL OR server_id = $2)
             AND ($3::bigint IS NULL OR user_id = $3)
             AND ($4::text IS NULL OR target_key ILIKE $4)
             ORDER BY invoked_at DESC, id DESC
             LIMIT $5 OFFSET $6"
        )));
    }

    #[test]
    fn paged_category_queries_count_filter_and_window_in_the_store() {
        for sql in [CATEGORY_PAGE_SQL, CATALOG_CATEGORY_PAGE_SQL] {
            assert!(sql.contains("COUNT(*) OVER()"));
            assert!(sql.contains(LIST_TOTAL_SQL_COLUMN));
            assert!(sql.contains("LIMIT $4 OFFSET $5"));
            assert!(sql.contains("LOWER(category_code) = $2"));
            assert!(sql.contains("LOWER(category_code) LIKE $3"));
            assert!(sql.contains("LOWER(name) LIKE $3"));
            assert!(sql.contains("LOWER(COALESCE(description, '')) LIKE $3"));
            assert!(normalized(sql).contains(&normalized(CATEGORY_SELECT)));
        }
    }

    /// The catalog half of each paged pair keeps the marketplace predicate and
    /// the admin half keeps the admin predicate; the two must not collapse.
    #[test]
    fn paged_listings_keep_the_catalog_admin_split() {
        assert!(SERVER_PAGE_SQL.contains(ACTIVE_ENTITY_FILTER));
        assert!(!SERVER_PAGE_SQL.contains(CATALOG_VISIBLE_FILTER));
        assert!(CATALOG_SERVER_PAGE_SQL.contains(CATALOG_VISIBLE_FILTER));
        assert!(!CATALOG_SERVER_PAGE_SQL.contains(ACTIVE_ENTITY_FILTER));

        assert!(CATEGORY_PAGE_SQL.contains(ACTIVE_ENTITY_FILTER));
        assert!(!CATEGORY_PAGE_SQL.contains(CATALOG_VISIBLE_FILTER));
        assert!(CATALOG_CATEGORY_PAGE_SQL.contains(CATALOG_VISIBLE_FILTER));
        assert!(!CATALOG_CATEGORY_PAGE_SQL.contains(ACTIVE_ENTITY_FILTER));
    }

    #[test]
    fn keyword_pattern_is_a_lowercased_escaped_contains_match() {
        assert_eq!(keyword_like_pattern(None), None);
        assert_eq!(keyword_like_pattern(Some("   ")), None);
        assert_eq!(
            keyword_like_pattern(Some(" OCR ")),
            Some("%ocr%".to_string())
        );
        assert_eq!(
            keyword_like_pattern(Some("100%_done")),
            Some("%100\\%\\_done%".to_string())
        );
        assert_eq!(
            keyword_like_pattern(Some("a\\b")),
            Some("%a\\\\b%".to_string())
        );
    }
}
