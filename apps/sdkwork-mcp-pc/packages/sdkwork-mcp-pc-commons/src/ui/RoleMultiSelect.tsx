import { MCP_ASSIGNABLE_ROLES, type McpAssignableRole } from '../roleAssignment';

/**
 * Multi-select for the IAM roles an MCP server is assigned to.
 *
 * An empty selection is the default and means every role can see the server,
 * so "All roles" is the first row and clears every specific role. Codes already
 * assigned but absent from the shared catalog stay selectable.
 */
export function RoleMultiSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value);
  const allRoles = value.length === 0;
  const known = new Set(MCP_ASSIGNABLE_ROLES.map((role) => role.code));
  const extras: McpAssignableRole[] = [...selected]
    .filter((code) => !known.has(code))
    .sort()
    .map((code) => ({ code, label: 'Custom role' }));
  const roles = [...MCP_ASSIGNABLE_ROLES, ...extras];

  return (
    <fieldset
      disabled={disabled}
      className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-zinc-700"
    >
      <legend className="px-1 font-medium text-slate-900 dark:text-zinc-100">
        Visible to roles
      </legend>
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" checked={allRoles} onChange={() => onChange([])} />
        <span>All roles (default)</span>
      </label>
      {roles.map((role) => (
        <label key={role.code} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.has(role.code)}
            onChange={(event) => {
              const next = new Set(value);
              if (event.target.checked) {
                next.add(role.code);
              } else {
                next.delete(role.code);
              }
              onChange([...next]);
            }}
          />
          <span>
            {role.label} (<code className="font-mono text-xs">{role.code}</code>)
          </span>
        </label>
      ))}
    </fieldset>
  );
}
