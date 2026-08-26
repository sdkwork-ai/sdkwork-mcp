import { FormEvent, useState } from 'react';
import {
  Button,
  ErrorAlert,
  Field,
  PageHeader,
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

const defaultForm: UpsertMcpServerCategoryCommand = {
  category_code: 'integrations',
  name: 'Integrations',
  description: 'Third-party and integration MCP servers.',
  sort_order: 10,
};

export function AdminCategoriesPage() {
  const clients = useMCPClients();
  const [form, setForm] = useState<UpsertMcpServerCategoryCommand>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: categories, error: loadError, loading, reload } = useAsyncResource(
    () => listAdminCategories(clients),
    [clients],
  );

  function openCreate() {
    setForm(defaultForm);
    setDrawerOpen(true);
  }

  function openEdit(category: NonNullable<typeof categories>[number]) {
    setForm({
      category_code: category.category_code ?? undefined,
      name: category.name ?? undefined,
      description: category.description ?? undefined,
      sort_order: category.sort_order ?? undefined,
    });
    setDrawerOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await upsertAdminCategory(clients, form);
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
        description="Curate marketplace navigation groups. Platform categories use tenant_id=0 seeds."
        actions={(
          <Button type="button" onClick={openCreate}>
            Create category
          </Button>
        )}
      />
      {error || loadError ? <div className="mb-4"><ErrorAlert message={error ?? loadError ?? ''} /></div> : null}
      <div className="data-surface">
        <div className="table-frame">
          {loading ? (
            <p className="empty-state">Loading categories…</p>
          ) : !categories || categories.length === 0 ? (
            <div className="empty-state">
              <h3>No categories</h3>
              <p>Create categories from the header action.</p>
              <button type="button" className="skills-console-primary" onClick={openCreate}>
                Create category
              </button>
            </div>
          ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{category.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{category.category_code}</td>
                  <td className="px-4 py-3">{category.sort_order}</td>
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
        title={form.category_code ? 'Save category' : 'Create category'}
        onClose={() => setDrawerOpen(false)}
      >
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="Category code">
            <TextInput
              value={form.category_code}
              onChange={(event) => setForm({ ...form, category_code: event.target.value })}
              required
            />
          </Field>
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
          <Field label="Sort order">
            <TextInput
              type="number"
              value={String(form.sort_order ?? 0)}
              onChange={(event) =>
                setForm({ ...form, sort_order: Number(event.target.value) || 0 })
              }
            />
          </Field>
          <div className="sdkwork-surface-drawer-form-actions">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save category</Button>
          </div>
        </form>
      </SurfaceDrawer>
    </div>
  );
}
