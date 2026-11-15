import { FormEvent, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataPanel,
  Field,
  SelectInput,
  TextArea,
  TextInput,
} from '@sdkwork/mcp-pc-commons';
import {
  upsertAdminPrompt,
  upsertAdminResource,
  upsertAdminTool,
  useMCPClients,
  type McpConnectorRecord,
  type McpPromptRecord,
  type McpResourceRecord,
  type McpToolRecord,
  type UpsertMcpPromptCommand,
  type UpsertMcpResourceCommand,
  type UpsertMcpToolCommand,
} from '@sdkwork/mcp-pc-core';

import { SurfaceDrawer } from './SurfaceOverlay.tsx';
import { mcpAdminLabel, useMcpAdminCopy, type McpAdminCopy } from '../copy/mcpAdminCopy';

type CapabilityKind = 'tool' | 'resource' | 'prompt';

/**
 * Seeds for a new capability. Keys, the sample URI and the JSON payloads are
 * identifiers; the display name and description are copy so a Chinese console
 * does not create English sample rows.
 */
const defaultTool = (connectorId: string, copy: McpAdminCopy): UpsertMcpToolCommand => ({
  connector_id: connectorId,
  tool_key: 'sample_tool',
  name: copy.capabilities.seed.toolName,
  description: copy.capabilities.seed.toolDescription,
  input_schema_json: '{}',
  output_schema_json: '{}',
  risk_level: 'low',
  requires_approval: false,
  enabled: true,
  sort_weight: 0,
});

const defaultResource = (
  connectorId: string,
  copy: McpAdminCopy,
): UpsertMcpResourceCommand => ({
  connector_id: connectorId,
  resource_key: 'sample_resource',
  uri: 'file:///workspace/sample',
  name: copy.capabilities.seed.resourceName,
  description: copy.capabilities.seed.resourceDescription,
  enabled: true,
});

const defaultPrompt = (
  connectorId: string,
  copy: McpAdminCopy,
): UpsertMcpPromptCommand => ({
  connector_id: connectorId,
  prompt_key: 'sample_prompt',
  name: copy.capabilities.seed.promptName,
  description: copy.capabilities.seed.promptDescription,
  arguments_schema_json: '[]',
  enabled: true,
});

export function AdminCapabilityPanel({
  serverId,
  connectors,
  tools,
  resources,
  prompts,
  onSaved,
}: {
  serverId: string;
  connectors: McpConnectorRecord[];
  tools: McpToolRecord[];
  resources: McpResourceRecord[];
  prompts: McpPromptRecord[];
  onSaved: () => Promise<void>;
}) {
  const clients = useMCPClients();
  const copy = useMcpAdminCopy();
  const [kind, setKind] = useState<CapabilityKind>('tool');
  const [error, setError] = useState<string | null>(null);
  const defaultConnectorId = connectors[0]?.id ?? '';
  const [toolForm, setToolForm] = useState<UpsertMcpToolCommand>(() =>
    defaultTool(defaultConnectorId, copy),
  );
  const [resourceForm, setResourceForm] = useState<UpsertMcpResourceCommand>(() =>
    defaultResource(defaultConnectorId, copy),
  );
  const [promptForm, setPromptForm] = useState<UpsertMcpPromptCommand>(() =>
    defaultPrompt(defaultConnectorId, copy),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const catalog = useMemo(() => {
    if (kind === 'tool') {
      return tools;
    }
    if (kind === 'resource') {
      return resources;
    }
    return prompts;
  }, [kind, tools, resources, prompts]);

  /** Localized label of the active capability kind, used by actions and headings. */
  const kindLabel = mcpAdminLabel(copy, 'capabilityKind', kind);

  if (connectors.length === 0) {
    return (
      <div className="empty-state">
        <h3>{copy.capabilities.requiresConnector.title}</h3>
        <p>{copy.capabilities.requiresConnector.description}</p>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (kind === 'tool') {
        await upsertAdminTool(clients, serverId, toolForm);
      } else if (kind === 'resource') {
        await upsertAdminResource(clients, serverId, resourceForm);
      } else {
        await upsertAdminPrompt(clients, serverId, promptForm);
      }
      await onSaved();
      setDrawerOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['tool', 'resource', 'prompt'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium ${kind === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}`}
              onClick={() => setKind(value)}
            >
              {mcpAdminLabel(copy, 'capabilityKind', value)}
            </button>
          ))}
        </div>
        <Button type="button" onClick={() => setDrawerOpen(true)}>
          {copy.capabilities.add(kindLabel)}
        </Button>
      </div>
      {error ? <p className="mb-4 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      {catalog.length === 0 ? (
        <div className="empty-state">
          <h3>{copy.capabilities.empty(kindLabel)}</h3>
          <p>{copy.capabilities.emptyHint}</p>
          <button type="button" className="skills-console-primary" onClick={() => setDrawerOpen(true)}>
            {copy.capabilities.add(kindLabel)}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {catalog.map((item) => (
            <DataPanel key={item.id}>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-slate-900 dark:text-zinc-100">{item.name}</h4>
                  {'enabled' in item ? (
                    <Badge tone={item.enabled ? 'success' : 'neutral'}>
                      {item.enabled ? copy.capabilities.enabled : copy.capabilities.disabled}
                    </Badge>
                  ) : null}
                </div>
                {'tool_key' in item ? (
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-400">{item.tool_key}</p>
                ) : null}
                {'resource_key' in item ? (
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-400">{item.resource_key}</p>
                ) : null}
                {'prompt_key' in item ? (
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-zinc-400">{item.prompt_key}</p>
                ) : null}
              </div>
            </DataPanel>
          ))}
        </div>
      )}
      <SurfaceDrawer
        open={drawerOpen}
        title={copy.capabilities.save(kindLabel)}
        onClose={() => setDrawerOpen(false)}
      >
        {/* `skills-console-form` is the host console contract; `grid gap-4` covers the
            standalone `sdkwork-mcp-pc` app, whose Tailwind entry defines no contract. */}
        <form onSubmit={onSubmit} className="skills-console-form grid gap-4">
          <Field label={copy.capabilities.fields.connector}>
            <SelectInput
              value={
                kind === 'tool'
                  ? toolForm.connector_id
                  : kind === 'resource'
                    ? resourceForm.connector_id
                    : promptForm.connector_id
              }
              onChange={(event) => {
                const connectorId = event.target.value;
                if (kind === 'tool') {
                  setToolForm({ ...toolForm, connector_id: connectorId });
                } else if (kind === 'resource') {
                  setResourceForm({ ...resourceForm, connector_id: connectorId });
                } else {
                  setPromptForm({ ...promptForm, connector_id: connectorId });
                }
              }}
              required
            >
              {connectors.map((connector) => (
                <option key={connector.id} value={connector.id}>
                  {connector.connector_key}
                </option>
              ))}
            </SelectInput>
          </Field>
          {kind === 'tool' ? (
            <>
              <Field label={copy.capabilities.fields.toolKey}>
                <TextInput
                  value={toolForm.tool_key}
                  onChange={(event) => setToolForm({ ...toolForm, tool_key: event.target.value })}
                  required
                />
              </Field>
              <Field label={copy.capabilities.fields.name}>
                <TextInput
                  value={toolForm.name}
                  onChange={(event) => setToolForm({ ...toolForm, name: event.target.value })}
                  required
                />
              </Field>
              <Field label={copy.capabilities.fields.riskLevel}>
                <SelectInput
                  value={toolForm.risk_level ?? 'low'}
                  onChange={(event) => setToolForm({ ...toolForm, risk_level: event.target.value })}
                >
                  <option value="low">{mcpAdminLabel(copy, 'riskLevel', 'low')}</option>
                  <option value="medium">{mcpAdminLabel(copy, 'riskLevel', 'medium')}</option>
                  <option value="high">{mcpAdminLabel(copy, 'riskLevel', 'high')}</option>
                </SelectInput>
              </Field>
              <Field label={copy.capabilities.fields.inputSchema}>
                <TextArea
                  value={toolForm.input_schema_json ?? '{}'}
                  onChange={(event) =>
                    setToolForm({ ...toolForm, input_schema_json: event.target.value })
                  }
                />
              </Field>
            </>
          ) : null}
          {kind === 'resource' ? (
            <>
              <Field label={copy.capabilities.fields.resourceKey}>
                <TextInput
                  value={resourceForm.resource_key}
                  onChange={(event) =>
                    setResourceForm({ ...resourceForm, resource_key: event.target.value })
                  }
                  required
                />
              </Field>
              <Field label={copy.capabilities.fields.uri}>
                <TextInput
                  value={resourceForm.uri}
                  onChange={(event) => setResourceForm({ ...resourceForm, uri: event.target.value })}
                  required
                />
              </Field>
              <Field label={copy.capabilities.fields.name}>
                <TextInput
                  value={resourceForm.name}
                  onChange={(event) => setResourceForm({ ...resourceForm, name: event.target.value })}
                  required
                />
              </Field>
            </>
          ) : null}
          {kind === 'prompt' ? (
            <>
              <Field label={copy.capabilities.fields.promptKey}>
                <TextInput
                  value={promptForm.prompt_key}
                  onChange={(event) =>
                    setPromptForm({ ...promptForm, prompt_key: event.target.value })
                  }
                  required
                />
              </Field>
              <Field label={copy.capabilities.fields.name}>
                <TextInput
                  value={promptForm.name}
                  onChange={(event) => setPromptForm({ ...promptForm, name: event.target.value })}
                  required
                />
              </Field>
              <Field label={copy.capabilities.fields.argumentsSchema}>
                <TextArea
                  value={promptForm.arguments_schema_json ?? '[]'}
                  onChange={(event) =>
                    setPromptForm({ ...promptForm, arguments_schema_json: event.target.value })
                  }
                />
              </Field>
            </>
          ) : null}
          <div className="sdkwork-surface-drawer-form-actions">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>
              {copy.common.cancel}
            </Button>
            <Button type="submit">{copy.capabilities.save(kindLabel)}</Button>
          </div>
        </form>
      </SurfaceDrawer>
    </div>
  );
}
