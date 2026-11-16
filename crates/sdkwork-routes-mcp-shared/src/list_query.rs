use serde::Deserialize;

use sdkwork_utils_rust::{CatalogViewFilter, CatalogViewQuery};

use crate::response::ApiProblem;

/// Standard GET list query parameters (`API_SPEC.md` section 14.1) plus the
/// catalog view filters (`category_code`, `role_codes`).
#[derive(Debug, Default, Deserialize)]
pub struct SdkWorkListQuery {
    #[serde(
        default,
        deserialize_with = "sdkwork_utils_rust::serde_query_int::option_i32"
    )]
    pub page: Option<i32>,
    #[serde(
        default,
        deserialize_with = "sdkwork_utils_rust::serde_query_int::option_i32"
    )]
    pub page_size: Option<i32>,
    pub cursor: Option<String>,
    pub q: Option<String>,
    /// Shared catalog view vocabulary: one category code from the registry
    /// (`all` keeps every category) plus the comma-separated IAM role codes of
    /// the signed-in caller (empty keeps the "all data" view).
    #[serde(flatten)]
    pub catalog: CatalogViewQuery,
}

impl SdkWorkListQuery {
    pub fn validate(&self) -> Result<(), ApiProblem> {
        let cursor = self
            .cursor
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty());
        if cursor.is_some() {
            return Err(ApiProblem::bad_request(
                "cursor pagination is not supported yet; use page and page_size",
            ));
        }
        // An out-of-range window is rejected (`40003`) rather than clamped: a
        // client that asked for more rows than the operation serves must learn
        // it, not silently receive a smaller page.
        sdkwork_utils_rust::http_api::validated_offset_list_params(
            self.page.map(i64::from),
            self.page_size.map(i64::from),
        )
        .map(|_| ())
        .map_err(|_| {
            ApiProblem::invalid_parameter(format!(
                "page must be between 1 and {}, page_size must be between 1 and {}",
                sdkwork_utils_rust::http_api::MAX_LIST_PAGE,
                sdkwork_utils_rust::http_api::MAX_LIST_PAGE_SIZE
            ))
        })
    }

    pub fn effective_page_size(&self) -> i32 {
        self.page_size.unwrap_or(20).clamp(1, 200)
    }

    pub fn effective_page(&self) -> i32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn search_keyword(&self) -> Option<&str> {
        self.q
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
    }

    /// Normalized catalog view: `all`/blank keeps every category, and an empty
    /// role scope keeps the "all data" view. Values are canonical lowercase.
    pub fn catalog_filter(&self) -> CatalogViewFilter {
        self.catalog.to_filter()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn query_with(category_code: Option<&str>, role_codes: Option<&str>) -> SdkWorkListQuery {
        SdkWorkListQuery {
            catalog: CatalogViewQuery {
                category_code: category_code.map(str::to_string),
                role_codes: role_codes.map(str::to_string),
            },
            ..Default::default()
        }
    }

    fn roles(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    #[test]
    fn rejects_cursor_pagination() {
        let query = SdkWorkListQuery {
            cursor: Some("cursor-1".into()),
            ..Default::default()
        };
        assert!(query.validate().is_err());
    }

    #[test]
    fn effective_page_size_defaults_and_clamps() {
        let default_query = SdkWorkListQuery::default();
        assert_eq!(default_query.effective_page_size(), 20);

        let oversized = SdkWorkListQuery {
            page_size: Some(500),
            ..Default::default()
        };
        assert_eq!(oversized.effective_page_size(), 200);
    }

    /// `PAGINATION_SPEC` §3: an out-of-range window is rejected (`40003`), not
    /// clamped — a caller that asked for more rows than the operation serves
    /// must see the failure instead of silently receiving a smaller page.
    #[test]
    fn validate_rejects_an_out_of_range_page_window() {
        for query in [
            SdkWorkListQuery {
                page: Some(0),
                ..Default::default()
            },
            SdkWorkListQuery {
                page: Some(10_001),
                ..Default::default()
            },
            SdkWorkListQuery {
                page_size: Some(0),
                ..Default::default()
            },
            SdkWorkListQuery {
                page_size: Some(201),
                ..Default::default()
            },
        ] {
            let error = query
                .validate()
                .expect_err("out-of-range paging must be rejected");
            assert!(
                format!("{error:?}").contains("page must be between 1 and"),
                "expected the invalid-parameter message, got {error:?}"
            );
        }

        assert!(SdkWorkListQuery {
            page: Some(2),
            page_size: Some(200),
            ..Default::default()
        }
        .validate()
        .is_ok());
    }

    #[test]
    fn search_keyword_trims_blank_values() {
        let query = SdkWorkListQuery {
            q: Some("  ping  ".into()),
            ..Default::default()
        };
        assert_eq!(query.search_keyword(), Some("ping"));

        let blank = SdkWorkListQuery {
            q: Some("   ".into()),
            ..Default::default()
        };
        assert_eq!(blank.search_keyword(), None);
    }

    #[test]
    fn omitted_and_all_selectors_keep_the_all_data_view() {
        assert!(query_with(None, None).catalog_filter().is_all_data());
        assert!(query_with(Some("all"), Some(" "))
            .catalog_filter()
            .is_all_data());
        assert!(query_with(Some("  "), None).catalog_filter().is_all_data());
        assert!(query_with(Some("ALL"), None).catalog_filter().is_all_data());
        assert!(query_with(Some("全部"), None)
            .catalog_filter()
            .is_all_data());
        assert_eq!(
            query_with(None, None).catalog_filter().category_code(),
            None
        );
    }

    #[test]
    fn category_filter_keeps_all_for_the_all_selector() {
        let all_selector = query_with(Some("all"), None);
        assert_eq!(all_selector.catalog_filter().category_code(), None);

        let narrowed = query_with(Some(" data-retrieval "), None);
        assert_eq!(
            narrowed.catalog_filter().category_code(),
            Some("data-retrieval")
        );
        assert!(!narrowed.catalog_filter().is_all_data());
    }

    #[test]
    fn role_scope_is_empty_for_the_all_view() {
        assert!(query_with(None, None)
            .catalog_filter()
            .role_codes()
            .is_empty());
        assert_eq!(
            query_with(None, Some("org_operations, Org_Admin,,ORG_ADMIN,"))
                .catalog_filter()
                .role_codes(),
            roles(&["org_admin", "org_operations"]).as_slice()
        );
    }

    #[test]
    fn catalog_filter_composes_category_and_role_scope() {
        let filter = query_with(Some("data-retrieval"), Some("org_auditor")).catalog_filter();
        assert!(filter.allows(Some("data-retrieval"), &[]));
        assert!(filter.allows(Some("DATA-RETRIEVAL"), &roles(&["org_auditor"])));
        assert!(!filter.allows(Some("data-retrieval"), &roles(&["org_finance"])));
        assert!(!filter.allows(Some("image-processing"), &[]));
        assert!(!filter.allows(None, &[]));
    }

    #[test]
    fn camel_case_aliases_are_accepted() {
        let query: SdkWorkListQuery =
            serde_json::from_str(r#"{"categoryCode":"all","roleCodes":"org_admin"}"#)
                .expect("query deserializes");
        assert_eq!(query.catalog_filter().category_code(), None);
        assert_eq!(
            query.catalog_filter().role_codes(),
            roles(&["org_admin"]).as_slice()
        );
    }

    #[test]
    fn flatten_keeps_the_url_wire_form() {
        use axum::http::Uri;

        let uri: Uri = "/api/v1/mcp/servers?page=2&page_size=10&q=ocr&category_code=all&role_codes=org_admin%2Corg_auditor"
            .parse()
            .expect("uri parses");
        let axum::extract::Query(query) =
            axum::extract::Query::<SdkWorkListQuery>::try_from_uri(&uri)
                .expect("list query deserializes");
        assert_eq!(query.page, Some(2));
        assert_eq!(query.page_size, Some(10));
        assert_eq!(query.search_keyword(), Some("ocr"));
        assert_eq!(query.catalog_filter().category_code(), None);
        assert_eq!(
            query.catalog_filter().role_codes(),
            roles(&["org_admin", "org_auditor"]).as_slice()
        );
    }

    #[test]
    fn nested_flatten_parses_paging_and_catalog_filters() {
        use axum::http::Uri;

        // The wrapper flattens the base list query, so the numeric paging fields
        // reach the inner DTO through serde's content buffer; the shared lenient
        // reader keeps them parseable next to the catalog filters.
        let uri: Uri =
            "/api/v1/mcp/invocations?page=2&page_size=10&server_id=42&category_code=all&role_codes=org_admin"
                .parse()
                .expect("uri parses");
        let axum::extract::Query(query) =
            axum::extract::Query::<McpInvocationListQuery>::try_from_uri(&uri)
                .expect("invocation query deserializes");
        assert_eq!(query.server_id, Some(42));
        assert_eq!(query.list.page, Some(2));
        assert_eq!(query.list.page_size, Some(10));
        assert_eq!(query.list.effective_page(), 2);
        assert_eq!(query.list.effective_page_size(), 10);
        let filter = query.list.catalog_filter();
        assert_eq!(filter.category_code(), None);
        assert_eq!(filter.role_codes(), roles(&["org_admin"]).as_slice());
        assert!(!filter.is_all_data());
    }

    #[test]
    fn nested_flatten_still_rejects_junk_paging() {
        use axum::http::Uri;

        let uri: Uri = "/api/v1/mcp/invocations?page=later"
            .parse()
            .expect("uri parses");
        assert!(axum::extract::Query::<McpInvocationListQuery>::try_from_uri(&uri).is_err());
    }
}

#[derive(Debug, Default, Deserialize)]
pub struct McpInvocationListQuery {
    #[serde(flatten)]
    pub list: SdkWorkListQuery,
    pub server_id: Option<u64>,
}

impl McpInvocationListQuery {
    pub fn validate(&self) -> Result<(), ApiProblem> {
        self.list.validate()
    }
}
