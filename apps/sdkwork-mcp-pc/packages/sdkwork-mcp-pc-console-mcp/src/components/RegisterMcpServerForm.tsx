import { useMemo, useState, type FormEvent } from 'react';
import { isBlank, trim } from '@sdkwork/utils';
import {
  ErrorAlert,
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import {
  createMcpServerIconImageService,
  createOwnMcpServer,
  updateOwnMcpServer,
  useMCPClients,
  type CreateOwnMcpServerCommand,
} from '@sdkwork/mcp-pc-core';
import {
  DriveUploadImage,
  useDriveUploadImageController,
  useDriveUploadImageSnapshot,
} from 'sdkwork-drive-pc-upload-image';
import { useMcpConsoleT } from '../locale.tsx';
import { mcpCategorySelectLabels } from '../i18n.ts';
import { McpCategorySelect } from './McpCategorySelect.tsx';
import { useMcpCategories } from '../hooks/useMcpCategories.ts';

type TransportKind = 'stdio' | 'sse' | 'http' | 'streamable-http';

const EMPTY_FORM = {
  serverKey: '',
  name: '',
  description: '',
  transport: 'streamable-http' as TransportKind,
  categoryCode: '',
  tags: '',
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
  const { categories, loading: categoriesLoading, error: categoriesError } = useMcpCategories();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Persist-first icon flow: the server record does not exist while the picker
  // is open, so the controller holds the picked image in `pending` and the
  // upload runs after `createOwnMcpServer` returns the entity id
  // (DRIVE_SPEC.md section 18.3 — appResourceId must anchor an existing entity).
  const iconService = useMemo(() => createMcpServerIconImageService(clients.drive), [clients]);
  const iconController = useDriveUploadImageController({ service: iconService, accept: ['image/*'] });
  const iconSnapshot = useDriveUploadImageSnapshot(iconController);
  const iconRefText = iconSnapshot.values[iconSnapshot.values.length - 1]?.uri ?? '';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (isBlank(trim(form.categoryCode))) {
      setError(t('register.error.categoryRequired'));
      return;
    }
    const command: CreateOwnMcpServerCommand = {
      server_key: trim(form.serverKey),
      name: trim(form.name),
      ...(trim(form.description) ? { description: trim(form.description) } : {}),
      transport: form.transport,
      category_code: trim(form.categoryCode),
      tags: form.tags
        .split(',')
        .map((value) => trim(value))
        .filter((value) => value.length > 0),
    };
    setSubmitting(true);
    try {
      const record = await createOwnMcpServer(clients, command);
      const uploaded = await iconController.uploadPending({ appResourceId: record.id });
      const iconRef = uploaded[uploaded.length - 1]?.uri;
      if (iconRef !== undefined) {
        await updateOwnMcpServer(clients, record.server_key, { icon_ref: iconRef });
      }
      setForm(EMPTY_FORM);
      iconController.clear();
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
      <Field label={t('register.field.category')}>
        {categoriesError ? <ErrorAlert message={categoriesError} /> : null}
        <McpCategorySelect
          id="register-mcp-category"
          categories={categories}
          value={form.categoryCode}
          loading={categoriesLoading}
          disabled={submitting}
          onChange={(categoryCode) => setForm({ ...form, categoryCode })}
          labels={mcpCategorySelectLabels(t)}
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
        {/* `DriveUploadImage` renders one self-contained inline-flex slot; the
            host `.skills-console-field` grid stacks it into its own row, so the
            previous flex-row file-input/button layout concern no longer applies. */}
        <DriveUploadImage
          controller={iconController}
          service={iconService}
          shape="circle"
          sizePx={64}
          accept={['image/*']}
          copy={{
            pickImage: t('register.uploadIcon'),
            removeImage: t('register.icon.remove'),
            uploading: t('register.uploading'),
            uploadFailed: t('register.error.uploadFailed'),
          }}
        />
        {iconRefText ? (
          <small className="skills-console-field-hint">{iconRefText}</small>
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
          disabled={
            isBlank(trim(form.serverKey)) ||
            isBlank(trim(form.categoryCode)) ||
            iconSnapshot.isUploading ||
            submitting
          }
        >
          {t('register.submit')}
        </button>
      </div>
    </form>
  );
}
