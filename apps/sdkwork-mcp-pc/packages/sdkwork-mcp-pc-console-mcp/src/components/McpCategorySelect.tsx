import { useMemo, useState } from 'react';
import type { McpServerCategoryRecord } from '@sdkwork/mcp-pc-core';

/**
 * Managed single-select for MCP server categories.
 *
 * The console used to take a free-text `category_code`, which let users type a
 * code the admin console never published — that row then sits in an orphan
 * category no filter can reach. Categories are admin-owned (`mcpAdmin.listCategories`
 * / `upsertCategory`), so this control only offers published records and keeps
 * the choice mandatory.
 *
 * Kept inside `sdkwork-mcp-pc-console-mcp` (not hoisted into `-commons`) because
 * the control is bound to `McpServerCategoryRecord` and the MCP console's own
 * i18n catalog; `-commons` must stay free of console locale coupling.
 */
export interface McpCategorySelectProps {
  categories: readonly McpServerCategoryRecord[];
  value: string;
  onChange: (categoryCode: string) => void;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  labels: {
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
    groupLabel: string;
    searchPlaceholder: string;
    noMatch: string;
    selected: (name: string) => string;
  };
}

export function McpCategorySelect({
  categories,
  value,
  onChange,
  disabled = false,
  loading = false,
  id = 'mcp-category-select',
  labels,
}: McpCategorySelectProps) {
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => categories.find((item) => item.category_code === value) ?? null,
    [categories, value],
  );

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((item) => {
      if (item.category_code === value) return true;
      return (
        item.category_code.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword)
      );
    });
  }, [categories, query, value]);

  if (loading) {
    return <p className="skills-console-status">{labels.loading}</p>;
  }

  if (categories.length === 0) {
    return (
      <div className="skills-console-category-empty" data-testid="mcp-category-empty">
        <strong>{labels.emptyTitle}</strong>
        <span>{labels.emptyDescription}</span>
      </div>
    );
  }

  return (
    <div className="skills-console-category-picker" data-testid="mcp-category-picker">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchPlaceholder}
        disabled={disabled}
      />
      <div
        id={id}
        role="radiogroup"
        aria-label={labels.groupLabel}
        className="skills-console-category-options"
      >
        {visible.length === 0 ? (
          <p className="skills-console-category-no-match">{labels.noMatch}</p>
        ) : (
          visible.map((item) => {
            const checked = item.category_code === value;
            return (
              <label
                key={item.id}
                className={
                  checked
                    ? 'skills-console-category-option is-selected'
                    : 'skills-console-category-option'
                }
              >
                <input
                  type="radio"
                  name={id}
                  value={item.category_code}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(item.category_code)}
                />
                <span className="skills-console-category-option-body">
                  <span className="skills-console-category-option-name">{item.name}</span>
                  <span className="skills-console-category-option-code">{item.category_code}</span>
                </span>
              </label>
            );
          })
        )}
      </div>
      {selected ? (
        <p className="skills-console-category-selected" data-testid="mcp-category-selected">
          {labels.selected(selected.name)}
        </p>
      ) : null}
    </div>
  );
}
