//! Catalog view filters shared by the app and admin server list surfaces.
//!
//! An MCP server catalog listing is narrowed by two independent, optional
//! filters:
//!
//! - **category**: one `category_code` from the category registry
//!   (`ai_mcp_server_category`), or every category when the caller asks for
//!   `all` (or omits the filter).
//! - **role scope**: the IAM role codes of the signed-in caller. An empty scope
//!   is the "all data" view; a populated scope keeps the servers that name one
//!   of those roles in `allowed_role_codes` *plus* the servers open to every
//!   role, so the caller still sees the catalog entries their whole tenant
//!   shares.
//!
//! Neither filter widens visibility: the repository already scopes rows to the
//! caller's tenant, and both filters only remove rows from that set.

/// Selector value that keeps every category in a listing.
pub const CATALOG_ALL_CATEGORIES: &str = "all";

/// Localized equivalent of [`CATALOG_ALL_CATEGORIES`] the client ships.
const CATALOG_ALL_CATEGORIES_ZH: &str = "全部";

/// Normalizes a category selector to `None` (every category) or one code.
///
/// The registry codes are lower-kebab, so the comparison is case-insensitive
/// and the returned code keeps the caller's spelling for the echoed filter.
pub fn normalize_category_filter(value: Option<&str>) -> Option<String> {
    let trimmed = value?.trim();
    if trimmed.is_empty()
        || trimmed.eq_ignore_ascii_case(CATALOG_ALL_CATEGORIES)
        || trimmed == CATALOG_ALL_CATEGORIES_ZH
    {
        return None;
    }
    Some(trimmed.to_string())
}

/// Parses a comma-separated `role_codes` value into a sorted, unique scope.
///
/// Codes are IAM role codes (`NAMING_SPEC.md` role-code pattern); blank entries
/// are dropped rather than rejected so a trailing comma stays harmless.
pub fn normalize_role_code_filter(value: Option<&str>) -> Vec<String> {
    let Some(value) = value else {
        return Vec::new();
    };
    let mut codes = value
        .split(',')
        .map(str::trim)
        .filter(|code| !code.is_empty())
        .map(str::to_string)
        .collect::<Vec<_>>();
    codes.sort();
    codes.dedup();
    codes
}

/// True when a server restricted to `allowed` is part of the caller's scope.
///
/// An empty `role_codes` is the "all data" view and matches everything. An
/// empty `allowed` list means the server is open to every role (the documented
/// default in `McpServerRecord::allowed_role_codes`), so it matches every
/// scope.
pub fn role_scope_allows(allowed: &[String], role_codes: &[String]) -> bool {
    role_codes.is_empty()
        || allowed.is_empty()
        || allowed.iter().any(|code| {
            role_codes
                .iter()
                .any(|scope| scope.eq_ignore_ascii_case(code))
        })
}

/// True when a server's category matches the normalized category filter.
pub fn category_matches(server_category: Option<&str>, category: &str) -> bool {
    server_category.is_some_and(|value| value.eq_ignore_ascii_case(category))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn category_filter_drops_the_all_selectors() {
        assert_eq!(normalize_category_filter(None), None);
        assert_eq!(normalize_category_filter(Some("  ")), None);
        assert_eq!(normalize_category_filter(Some("ALL")), None);
        assert_eq!(normalize_category_filter(Some("全部")), None);
        assert_eq!(
            normalize_category_filter(Some(" data-retrieval ")),
            Some("data-retrieval".to_string())
        );
    }

    #[test]
    fn role_code_filter_trims_sorts_and_dedupes() {
        assert_eq!(normalize_role_code_filter(None), Vec::<String>::new());
        assert_eq!(
            normalize_role_code_filter(Some("org_admin, org_operations,,org_admin,")),
            vec!["org_admin".to_string(), "org_operations".to_string()]
        );
    }

    #[test]
    fn role_scope_matches_open_servers_and_named_roles() {
        let all_data: Vec<String> = Vec::new();
        let operator = vec!["org_admin".to_string()];
        let open: Vec<String> = Vec::new();
        let restricted = vec!["org_finance".to_string()];

        assert!(role_scope_allows(&restricted, &all_data));
        assert!(role_scope_allows(&open, &operator));
        assert!(role_scope_allows(&["ORG_ADMIN".to_string()], &operator));
        assert!(!role_scope_allows(&restricted, &operator));
    }

    #[test]
    fn category_match_is_case_insensitive_and_never_matches_absent_codes() {
        assert!(category_matches(Some("Data-Retrieval"), "data-retrieval"));
        assert!(!category_matches(
            Some("image-processing"),
            "data-retrieval"
        ));
        assert!(!category_matches(None, "data-retrieval"));
    }
}
