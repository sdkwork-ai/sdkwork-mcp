import { readRuntimeEnv } from '@sdkwork/sdk-common';
import { isBlank, trim } from '@sdkwork/utils';

export { readRuntimeEnv };

export function normalizeApiBaseUrl(baseUrl: string): string {
  const normalized = trim(baseUrl);
  if (isBlank(normalized)) {
    return '';
  }
  return normalized.replace(/\/+$/, '');
}

export function resolveMCPDriveSpaceId(): string | undefined {
  return readRuntimeEnv('VITE_SDKWORK_MCP_DRIVE_SPACE_ID');
}

export function resolveMCPDriveParentNodeId(): string | undefined {
  return readRuntimeEnv('VITE_SDKWORK_MCP_DRIVE_PARENT_NODE_ID');
}
