import { useRef, useState, type FormEvent } from 'react';
import { isBlank, trim } from '@sdkwork/utils';
import {
  Button,
  ErrorAlert,
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import {
  createOwnMcpServer,
  uploadServerIcon,
  useMCPClients,
  type CreateOwnMcpServerCommand,
} from '@sdkwork/mcp-pc-core';
import { useMcpConsoleT } from '../locale.tsx';

type TransportKind = 'stdio' | 'sse' | 'http' | 'streamable-http';

const EMPTY_FORM = {
  serverKey: '',
  name: '',
  description: '',
  transport: 'streamable-http' as TransportKind,
  categoryCode: '',
  tags: '',
  iconRef: '',
  endpointUrl: '',
  commandRef: '',
};

export interface RegisterMcpServerFormProps {
  onSuccess?: (serverKey: string) => void;
  onCancel?: () => void;
}

export function RegisterMcpServerForm({ onSuccess, onCancel }: RegisterMcpServerFormProps) {
  const t = useMcpConsoleT();
  const clients = useMCPClients();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onUploadIcon() {
    const file = iconInputRef.current?.files?.[0];
    if (!file) {
      setError(t('register.error.selectIcon'));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const iconRef = await uploadServerIcon(clients.drive, file);
      setForm((current) => ({ ...current, iconRef }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const command: CreateOwnMcpServerCommand = {
      server_key: trim(form.serverKey),
      name: trim(form.name),
      ...(trim(form.description) ? { description: trim(form.description) } : {}),
      transport: form.transport,
      ...(trim(form.categoryCode) ? { category_code: trim(form.categoryCode) } : {}),
      tags: form.tags
        .split(',')
        .map((value) => trim(value))
        .filter((value) => value.length > 0),
      ...(trim(form.iconRef) ? { icon_ref: trim(form.iconRef) } : {}),
    };
    setSubmitting(true);
    try {
      const record = await createOwnMcpServer(clients, command);
      setForm(EMPTY_FORM);
      onSuccess?.(record.server_key);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? <ErrorAlert message={error} /> : null}
      <Field label={t('register.field.serverKey')}>
        <TextInput
          value={form.serverKey}
          onChange={(event) => setForm({ ...form, serverKey: event.target.value })}
          placeholder={t('register.placeholder.serverKey')}
          required
        />
      </Field>
      <Field label={t('register.field.name')}>
        <TextInput
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder={t('register.placeholder.name')}
          required
        />
      </Field>
      <Field label={t('register.field.description')}>
        <TextArea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder={t('register.placeholder.description')}
        />
      </Field>
      <Field label={t('register.field.transport')}>
        <SelectInput
          value={form.transport}
          onChange={(event) =>
            setForm({ ...form, transport: event.target.value as TransportKind })
          }
        >
          <option value="streamable-http">streamable-http</option>
          <option value="http">http</option>
          <option value="stdio">stdio</option>
          <option value="sse">sse</option>
        </SelectInput>
      </Field>
      {form.transport === 'stdio' ? (
        <Field label={t('register.field.commandRef')} hint={t('register.field.commandRef.hint')}>
          <TextInput
            value={form.commandRef}
            onChange={(event) => setForm({ ...form, commandRef: event.target.value })}
            placeholder={t('register.placeholder.commandRef')}
          />
        </Field>
      ) : (
        <Field label={t('register.field.endpointUrl')}>
          <TextInput
            value={form.endpointUrl}
            onChange={(event) => setForm({ ...form, endpointUrl: event.target.value })}
            placeholder={t('register.placeholder.endpointUrl')}
            type="url"
          />
        </Field>
      )}
      <Field label={t('register.field.categoryCode')}>
        <TextInput
          value={form.categoryCode}
          onChange={(event) => setForm({ ...form, categoryCode: event.target.value })}
          placeholder={t('register.placeholder.categoryCode')}
        />
      </Field>
      <Field label={t('register.field.tags')} hint={t('register.field.tags.hint')}>
        <TextInput
          value={form.tags}
          onChange={(event) => setForm({ ...form, tags: event.target.value })}
          placeholder={t('register.placeholder.tags')}
        />
      </Field>
      <Field label={t('register.field.icon')} hint={t('register.field.icon.hint')}>
        <div className="flex items-center gap-3">
          <input ref={iconInputRef} type="file" accept="image/*" />
          <Button type="button" variant="secondary" onClick={onUploadIcon} disabled={uploading || submitting}>
            {uploading ? t('register.uploading') : t('register.uploadIcon')}
          </Button>
        </div>
        {trim(form.iconRef) ? (
          <span className="text-xs text-slate-500">{form.iconRef}</span>
        ) : null}
      </Field>
      <div className="sdkwork-surface-drawer-form-actions">
        {onCancel ? (
          <button type="button" className="sdkwork-surface-modal-cancel" onClick={onCancel} disabled={submitting}>
            {t('dialog.cancel')}
          </button>
        ) : null}
        <Button type="submit" disabled={isBlank(trim(form.serverKey)) || uploading || submitting}>
          {t('register.submit')}
        </Button>
      </div>
    </form>
  );
}
