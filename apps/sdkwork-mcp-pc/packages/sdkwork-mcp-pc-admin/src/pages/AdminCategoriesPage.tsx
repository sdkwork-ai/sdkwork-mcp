import { FormEvent, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  ErrorAlert,
  Field,
  LoadingState,
  PageHeader,
  SelectInput,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import {
  listAdminCategories,
  upsertAdminCategory,
  useAsyncResource,
  useMCPClients,
  type UpsertMcpServerCategoryCommand,
} from '@sdkwork/mcp-pc-core';

import { SurfaceDrawer } from '../components/SurfaceOverlay.tsx';

/**
 * Suggested seed for a new category. `integrations` is the taxonomy's
 * conventional first bucket (third-party servers that are not first-party
 * tooling), and the code doubles as the identity the upsert keys on.
 */
const defaultForm: UpsertMcpServerCategoryCommand = {
  category_code: 'integrations',
  name: 'Integrations',
  description: 'Third-party and integration MCP servers.',
  sort_order: 10,
  parent_id: '',
  icon_ref: '',
};

/**
 * Admin curation surface for the MCP server category taxonomy.
 *
 * ## Why this page lives here
 * It is the page layer of `sdkwork-mcp-pc-admin`, the module's own
 * administrative surface. The host (`sdkwork-webserver`) only mounts it; every
 * rule below — that identity is the code, that the tree is two levels deep —
 * is owned here.
 *
 * ## Write semantics: upsert by code, not by id
 * The backend exposes exactly two endpoints, `mcpAdmin.listCategories` and
 * `mcpAdmin.upsertCategory`, and the write command carries **no id**. Identity
 * is therefore the `category_code`: saving an existing code overwrites that
 * category, and saving a new code creates one. This page reflects that honestly
 * — there is no separate "create" versus "edit" call, only whether the code the
 * operator types already exists.
 *
 * ## What the backend does and does not allow
 * - **No delete endpoint.** Retirement is not modelled at all on this contract,
 *   so the page states the constraint rather than offering a button that would
 *   fail. Operators rename or repurpose a code instead.
 * - `lifecycle_status` is on the record but **absent from the write command**,
 *   i.e. it is server-managed. It is shown read-only so an operator can see a
 *   category's state without believing they can set it.
 * - `parent_id` references another category's **id**, so the parent picker
 *   submits ids while the table renders names.
 */
export function AdminCategoriesPage() {
  const clients = useMCPClients();
  const [form, setForm] = useState<UpsertMcpServerCategoryCommand>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: categories, error: loadError, loading, reload } = useAsyncResource(
    () => listAdminCategories(clients),
    [clients],
  );

  /** Sorted the way the catalog tree reads: by `sort_order`, then code. */
  const sorted = useMemo(() => {
    return (categories ?? []).slice().sort((a, b) => {
      const byOrder = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (byOrder !== 0) return byOrder;
      return (a.category_code ?? '').localeCompare(b.category_code ?? '');
    });
  }, [categories]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of sorted) {
      map.set(item.id, item.name);
    }
    return map;
  }, [sorted]);

  /** When editing, a category cannot be its own parent. */
  const parentOptions = useMemo(
    () => sorted.filter((item) => item.category_code !== form.category_code),
    [sorted, form.category_code],
  );

  /** Whether saving will overwrite an existing code rather than create one. */
  const isOverwrite = useMemo(
    () => sorted.some((item) => item.category_code === form.category_code),
    [sorted, form.category_code],
  );

  function openCreate() {
    setForm(defaultForm);
    setDrawerOpen(true);
  }

  function openEdit(category: NonNullable<typeof categories>[number]) {
    setForm({
      category_code: category.category_code ?? '',
      name: category.name ?? '',
      description: category.description ?? '',
      sort_order: category.sort_order ?? 0,
      // Sent as an empty string rather than omitted so the operator can actively
      // clear a parent; the command treats an empty value as "no parent".
      parent_id: category.parent_id ?? '',
      icon_ref: category.icon_ref ?? '',
    });
    setDrawerOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await upsertAdminCategory(clients, {
        category_code: form.category_code.trim(),
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        sort_order: form.sort_order ?? 0,
        parent_id: form.parent_id?.trim() || undefined,
        icon_ref: form.icon_ref?.trim() || undefined,
      });
      setDrawerOpen(false);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <div className="embedded-fill-page">
      <PageHeader
        title="Categories"
        description="Curate marketplace navigation groups. A category is identified by its code; saving an existing code updates it, and the backend exposes no delete."
        actions={(
          <Button type="button" onClick={openCreate}>
            Create category
          </Button>
        )}
      />
      {error || loadError ? (
        <div className="mb-4">
          <ErrorAlert message={error ?? loadError ?? ''} />
        </div>
      ) : null}
      <div className="data-surface">
        <div className="table-frame">
          {loading ? (
            <LoadingState label="Loading categories…" />
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <h3>No categories</h3>
              <p>
                Create one from the header action. MCP servers cannot be registered without a
                category.
              </p>
              <button type="button" className="skills-console-primary" onClick={openCreate}>
                Create category
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Sort</th>
                  <th className="px-4 py-3">Lifecycle</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {sorted.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-zinc-400">
                      {category.category_code}
                    </td>
                    <td className="px-4 py-3">
                      {category.parent_id ? nameById.get(category.parent_id) ?? '—' : '—'}
                    </td>
                    <td className="px-4 py-3">{category.sort_order}</td>
                    <td className="px-4 py-3">
                      <Badge>{category.lifecycle_status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button type="button" variant="secondary" onClick={() => openEdit(category)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SurfaceDrawer
        open={drawerOpen}
        title={isOverwrite ? `Save ${form.category_code}` : 'Create category'}
        onClose={() => setDrawerOpen(false)}
      >
        {/* `skills-console-form` is the host console contract; `grid gap-4` covers the
            standalone `sdkwork-mcp-pc` app, whose Tailwind entry defines no contract. */}
        <form onSubmit={onSubmit} className="skills-console-form grid gap-4">
          <Field label="Category code">
            <TextInput
              value={form.category_code}
              onChange={(event) => setForm({ ...form, category_code: event.target.value })}
              required
            />
          </Field>
          <p className="skills-console-field-hint">
            {isOverwrite
              ? 'This code already exists — saving overwrites that category.'
              : 'New code — saving creates a category.'}
          </p>
          <Field label="Name">
            <TextInput
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </Field>
          <Field label="Description">
            <TextInput
              value={form.description ?? ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="Parent category">
            <SelectInput
              value={form.parent_id ?? ''}
              onChange={(event) => setForm({ ...form, parent_id: event.target.value })}
            >
              <option value="">None (top level)</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Sort order">
            <TextInput
              type="number"
              value={String(form.sort_order ?? 0)}
              onChange={(event) =>
                setForm({ ...form, sort_order: Number(event.target.value) || 0 })
              }
            />
          </Field>
          <Field label="Icon reference">
            <TextInput
              value={form.icon_ref ?? ''}
              onChange={(event) => setForm({ ...form, icon_ref: event.target.value })}
            />
          </Field>
          <div className="sdkwork-surface-drawer-form-actions">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{isOverwrite ? 'Save category' : 'Create category'}</Button>
          </div>
        </form>
      </SurfaceDrawer>
    </div>
  );
}
