import { FormEvent, useMemo, useState } from 'react';
import { isBlank, trim } from '@sdkwork/utils';
import type { DriveUploadImageValue } from '@sdkwork/drive-upload-image-core';
import { DriveUploadImage } from 'sdkwork-drive-pc-upload-image';
import {
  Button,
  DataPanel,
  Field,
  MCP_LIFECYCLE_VALUES,
  MCP_TRANSPORT_VALUES,
  MCP_VISIBILITY_VALUES,
  RoleMultiSelect,
  SelectInput,
  TextArea,
  TextInput,
  normalizeAllowedRoleCodes,
} from '@sdkwork/mcp-pc-commons';
import { isDrivePackageRef } from '@sdkwork/mcp-pc-commons/driveUri';
import {
  createMcpServerIconImageService,
  updateAdminServer,
  useMCPClients,
  type McpServerRecord,
  type UpdateMcpServerCommand,
} from '@sdkwork/mcp-pc-core';

import { mcpAdminLabel, useMcpAdminCopy } from '../copy/mcpAdminCopy';

function toFormState(server: McpServerRecord): UpdateMcpServerCommand {
  return {
    name: server.name,
    description: server.description ?? '',
    transport: server.transport,
    visibility: server.visibility,
    category_code: server.category_code ?? '',
    tags: server.tags ?? [],
    allowed_role_codes: server.allowed_role_codes ?? [],
    icon_ref: server.icon_ref ?? '',
    lifecycle_status: server.lifecycle_status,
  };
}

export function AdminServerSettingsPanel({
  server,
  serverKey,
  onSaved,
}: {
  server: McpServerRecord;
  serverKey: string;
  onSaved: () => Promise<void>;
}) {
  const clients = useMCPClients();
  const copy = useMcpAdminCopy();
  const [form, setForm] = useState<UpdateMcpServerCommand>(() => toFormState(server));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const iconService = useMemo(() => createMcpServerIconImageService(clients.drive), [clients]);
  const iconValue = useMemo<DriveUploadImageValue | null>(() => {
    const iconRef = trim(form.icon_ref ?? '');
    if (isBlank(iconRef) || !isDrivePackageRef(iconRef)) {
      return null;
    }
    return { uri: iconRef, source: 'drive' };
  }, [form.icon_ref]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (form.icon_ref && !isDrivePackageRef(form.icon_ref)) {
        throw new Error(copy.common.iconRefInvalid);
      }
      await updateAdminServer(clients, serverKey, {
        ...form,
        tags: form.tags?.filter((tag) => !isBlank(trim(tag))),
        allowed_role_codes: normalizeAllowedRoleCodes(form.allowed_role_codes ?? []),
      });
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DataPanel>
      <form onSubmit={onSubmit} className="grid max-w-2xl gap-4 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
          {copy.settings.heading}
        </h3>
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <Field label={copy.settings.fields.name}>
          <TextInput
            value={form.name ?? ''}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </Field>
        <Field label={copy.settings.fields.description}>
          <TextArea
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </Field>
        <Field label={copy.settings.fields.transport}>
          <SelectInput
            value={form.transport ?? 'stdio'}
            onChange={(event) => setForm({ ...form, transport: event.target.value })}
          >
            {MCP_TRANSPORT_VALUES.map((value) => (
              <option key={value} value={value}>
                {mcpAdminLabel(copy, 'transport', value)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={copy.settings.fields.visibility}>
          <SelectInput
            value={form.visibility ?? 'tenant'}
            onChange={(event) => setForm({ ...form, visibility: event.target.value })}
          >
            {MCP_VISIBILITY_VALUES.map((value) => (
              <option key={value} value={value}>
                {mcpAdminLabel(copy, 'visibility', value)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={copy.settings.fields.lifecycleStatus}>
          <SelectInput
            value={form.lifecycle_status ?? 'draft'}
            onChange={(event) => setForm({ ...form, lifecycle_status: event.target.value })}
          >
            {MCP_LIFECYCLE_VALUES.map((value) => (
              <option key={value} value={value}>
                {mcpAdminLabel(copy, 'lifecycle', value)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={copy.settings.fields.categoryCode}>
          <TextInput
            value={form.category_code ?? ''}
            onChange={(event) => setForm({ ...form, category_code: event.target.value })}
          />
        </Field>
        <Field label={copy.settings.fields.tags} hint={copy.settings.fields.tagsHint}>
          <TextInput
            value={(form.tags ?? []).join(', ')}
            onChange={(event) =>
              setForm({
                ...form,
                tags: event.target.value.split(',').map((value) => trim(value)).filter(Boolean),
              })
            }
          />
        </Field>
        <RoleMultiSelect
          value={form.allowed_role_codes ?? []}
          onChange={(allowed_role_codes) => setForm({ ...form, allowed_role_codes })}
        />
        <Field label={copy.settings.fields.icon}>
          <DriveUploadImage
            service={iconService}
            appResourceId={server.id}
            value={iconValue}
            onChange={(value) =>
              setForm((current) => ({ ...current, icon_ref: value?.uri ?? '' }))
            }
            shape="circle"
            sizePx={64}
            accept={['image/*']}
            copy={copy.icon}
          />
          {form.icon_ref ? (
            <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
              {form.icon_ref}
            </span>
          ) : null}
        </Field>
        <Button type="submit" disabled={submitting}>
          {submitting ? copy.settings.saving : copy.settings.save}
        </Button>
      </form>
    </DataPanel>
  );
}
