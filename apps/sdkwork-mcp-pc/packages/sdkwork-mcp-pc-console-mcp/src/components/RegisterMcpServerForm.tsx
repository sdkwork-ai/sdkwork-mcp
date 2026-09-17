import { useRef, useState, type FormEvent } from 'react';
import { isBlank, trim } from '@sdkwork/utils';
import {
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
    <form onSubmit={onSubmit} className="skills-console-form">
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
        {/* Deliberately NO flex wrapper: the host contract `.skills-console-field` is
            `display: grid` and forces `width: 100%` on every nested `input`
            (webserver `src/index.css:1853-1864`). Putting the file input in a flex row
            makes that `width: 100%` resolve against the row and starve the button, which
            then shrinks below `max-content` and wraps its label. The host grid already
            stacks the two children into their own rows — comply with it, don't fight it. */}
        <input
          ref={iconInputRef}
          type="file"
          accept="image/*"
          aria-label={t('register.field.icon')}
        />
        {/* Console button styling comes from `.skills-console-field button[type="button"]`
            (token-driven: `width: max-content` + panel-muted background + text-primary).
            A `Button variant="secondary"` would paint a hardcoded `bg-white` under an
            inherited light text colour — white on white in dark mode. */}
        <button type="button" onClick={onUploadIcon} disabled={uploading || submitting}>
          {uploading ? t('register.uploading') : t('register.uploadIcon')}
        </button>
        {trim(form.iconRef) ? (
          <small className="skills-console-field-hint">{form.iconRef}</small>
        ) : null}
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
          disabled={isBlank(trim(form.serverKey)) || uploading || submitting}
        >
          {t('register.submit')}
        </button>
      </div>
    </form>
  );
}
