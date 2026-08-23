import { useEffect, useState, type FormEvent } from 'react';
import { isBlank, trim } from '@sdkwork/utils';
import {
  Button,
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

export interface EditMcpServerFormProps {
  serverKey: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditMcpServerForm({ serverKey, onSuccess, onCancel }: EditMcpServerFormProps) {
  const t = useMcpConsoleT();
  const clients = useMCPClients();
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
    const command: UpdateOwnMcpServerCommand = {
      name: trim(form.name),
      ...(trim(form.description) ? { description: trim(form.description) } : {}),
      ...(trim(form.categoryCode) ? { category_code: trim(form.categoryCode) } : {}),
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
    <form onSubmit={onSubmit} className="grid gap-4">
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
      <Field label={t('edit.field.categoryCode')}>
        <TextInput
          value={form.categoryCode}
          onChange={(event) => setForm({ ...form, categoryCode: event.target.value })}
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
        <Button type="submit" disabled={isBlank(trim(form.name)) || submitting}>
          {t('edit.save')}
        </Button>
      </div>
    </form>
  );
}
