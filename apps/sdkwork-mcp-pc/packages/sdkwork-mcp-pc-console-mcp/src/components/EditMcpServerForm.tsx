import { useEffect, useState, type FormEvent } from 'react';
import { isBlank, trim } from '@sdkwork/utils';
import {
  ErrorAlert,
  Field,
  LoadingState,
  TextArea,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import {
  listOwnedMcpServers,
  updateOwnMcpServer,
  useMCPClients,
  type UpdateOwnMcpServerCommand,
} from '@sdkwork/mcp-pc-core';
import { useMcpConsoleT } from '../locale.tsx';
import { mcpCategorySelectLabels } from '../i18n.ts';
import { McpCategorySelect } from './McpCategorySelect.tsx';
import { useMcpCategories } from '../hooks/useMcpCategories.ts';

export interface EditMcpServerFormProps {
  serverKey: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditMcpServerForm({ serverKey, onSuccess, onCancel }: EditMcpServerFormProps) {
  const t = useMcpConsoleT();
  const clients = useMCPClients();
  const { categories, loading: categoriesLoading, error: categoriesError } = useMcpCategories();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryCode: '',
    tags: '',
    iconRef: '',
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void listOwnedMcpServers(clients)
      .then((servers) => {
        if (!active) return;
        const record = servers.find((item) => item.server_key === serverKey);
        if (!record) {
          setError(t('edit.notFound', { serverKey }));
          return;
        }
        setForm({
          name: record.name ?? '',
          description: record.description ?? '',
          categoryCode: record.category_code ?? '',
          tags: (record.tags ?? []).join(', '),
          iconRef: record.icon_ref ?? '',
        });
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clients, serverKey, t]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (isBlank(trim(form.categoryCode))) {
      setError(t('edit.error.categoryRequired'));
      return;
    }
    const command: UpdateOwnMcpServerCommand = {
      name: trim(form.name),
      ...(trim(form.description) ? { description: trim(form.description) } : {}),
      category_code: trim(form.categoryCode),
      tags: form.tags
        .split(',')
        .map((value) => trim(value))
        .filter((value) => value.length > 0),
      ...(trim(form.iconRef) ? { icon_ref: trim(form.iconRef) } : {}),
    };
    setSubmitting(true);
    try {
      await updateOwnMcpServer(clients, serverKey, command);
      onSuccess?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label={t('edit.loading')} />;
  }

  return (
    <form onSubmit={onSubmit} className="skills-console-form">
      {error ? <ErrorAlert message={error} /> : null}
      <Field label={t('edit.field.name')}>
        <TextInput
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </Field>
      <Field label={t('edit.field.description')}>
        <TextArea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </Field>
      <Field label={t('edit.field.category')}>
        {categoriesError ? <ErrorAlert message={categoriesError} /> : null}
        <McpCategorySelect
          id="edit-mcp-category"
          categories={categories}
          value={form.categoryCode}
          loading={categoriesLoading}
          disabled={submitting}
          onChange={(categoryCode) => setForm({ ...form, categoryCode })}
          labels={mcpCategorySelectLabels(t)}
        />
      </Field>
      <Field label={t('edit.field.tags')} hint={t('edit.field.tags.hint')}>
        <TextInput
          value={form.tags}
          onChange={(event) => setForm({ ...form, tags: event.target.value })}
        />
      </Field>
      <Field label={t('edit.field.iconRef')}>
        <TextInput
          value={form.iconRef}
          onChange={(event) => setForm({ ...form, iconRef: event.target.value })}
          placeholder={t('edit.placeholder.iconRef')}
        />
      </Field>
      <div className="sdkwork-surface-drawer-form-actions">
        {onCancel ? (
          <button type="button" className="sdkwork-surface-modal-cancel" onClick={onCancel} disabled={submitting}>
            {t('dialog.cancel')}
          </button>
        ) : null}
        <button
          className="skills-console-primary"
          type="submit"
          disabled={isBlank(trim(form.name)) || isBlank(trim(form.categoryCode)) || submitting}
        >
          {t('edit.save')}
        </button>
      </div>
    </form>
  );
}
