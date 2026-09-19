/**
 * Application upload declaration constants.
 *
 * Authority: `DRIVE_SPEC.md` section 18 (Application Upload Declaration Contract).
 * Declared values live in `apps/sdkwork-mcp-pc/specs/upload.declaration.json`; this module
 * carries them into code so upload call sites reference a constant instead of repeating
 * literals. Call sites MUST NOT inline these values, and the declaration MUST NOT be
 * duplicated as a second local authority.
 *
 * The previous local values (`mcp-pc-asset-upload`, `mcp_self_service_asset_upload`,
 * `pc_local_file`, `mcp-server-icon`, `mcp_server_icon_upload`) were not rule-conforming:
 * `appResourceType` must be a dotted `<domain>.<resource>` business type and `source` must be a
 * stable kebab-case call-origin label. They are converged here to the declared values.
 */

export interface McpUploadDeclarationEntry {
  readonly appResourceIdKind: 'application' | 'entity' | 'draft';
  readonly appResourceType: string;
  readonly purpose: string;
  readonly retention: 'long_term' | 'temporary';
  readonly scene: string;
  readonly source: string;
  readonly uploadProfileCode: string;
}

/** This application's canonical appId, from `sdkwork.app.config.json` `backend.appId`. */
export const MCP_APP_ID = 'sdkwork-mcp-pc' as const;

/** The single call-origin label for every upload from this application. */
export const MCP_UPLOAD_SOURCE = 'sdkwork-mcp-pc' as const;

const MCP_APP_RESOURCE_ID_KIND = 'entity' as const;
const MCP_RETENTION = 'long_term' as const;

export const MCP_SERVER_ASSET_UPLOAD = {
  appResourceIdKind: MCP_APP_RESOURCE_ID_KIND,
  appResourceType: 'mcp.server_asset',
  purpose: 'MCP server package or resource uploaded by an author from the self-service surface.',
  retention: MCP_RETENTION,
  scene: 'mcp-self-service-asset-upload',
  source: MCP_UPLOAD_SOURCE,
  uploadProfileCode: 'generic',
} as const satisfies McpUploadDeclarationEntry;

export const MCP_SERVER_ICON_UPLOAD = {
  appResourceIdKind: MCP_APP_RESOURCE_ID_KIND,
  appResourceType: 'mcp.server_icon',
  purpose:
    'MCP server icon image uploaded so the server listing can be rendered in the catalog.',
  retention: MCP_RETENTION,
  scene: 'mcp-server-icon-upload',
  source: MCP_UPLOAD_SOURCE,
  uploadProfileCode: 'image',
} as const satisfies McpUploadDeclarationEntry;

/** Every declared upload purpose for this application. */
export const MCP_UPLOAD_DECLARATIONS: readonly McpUploadDeclarationEntry[] = [
  MCP_SERVER_ASSET_UPLOAD,
  MCP_SERVER_ICON_UPLOAD,
];
