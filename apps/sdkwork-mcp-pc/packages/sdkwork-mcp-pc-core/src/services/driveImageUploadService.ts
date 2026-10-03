import type { SdkworkDriveAppClient } from '@sdkwork/drive-app-sdk';
import {
  createDriveNodesImagePreviewReader,
  createDriveUploadImageService,
  type DriveUploadImageService,
} from '@sdkwork/drive-upload-image-core';
import { isBlank, trim } from '@sdkwork/utils';
import {
  resolveMCPDriveParentNodeId,
  resolveMCPDriveSpaceId,
} from '@sdkwork/mcp-pc-commons/runtime';

import { MCP_SERVER_ICON_UPLOAD } from '../sdk/uploadDeclaration';

function nonEmptyEnv(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = trim(value);
  return isBlank(normalized) ? undefined : normalized;
}

/**
 * Binds the shared Drive image-upload core to this application's declared MCP
 * server icon upload intent.
 *
 * `appResourceType`, `scene`, `source`, the upload profile, and retention all
 * come from the declaration constant (`../sdk/uploadDeclaration`, mirrored by
 * `apps/sdkwork-mcp-pc/specs/upload.declaration.json`) — call sites never
 * compose upload intent inline and never touch the SDK uploader directly
 * (DRIVE_SPEC.md section 18.3). The entity anchor (`appResourceId`) is supplied
 * per upload by the caller: the server record must exist before the icon is
 * uploaded, so create flows defer the upload until the record is persisted.
 */
export function createMcpServerIconImageService(
  driveClient: SdkworkDriveAppClient,
): DriveUploadImageService {
  const spaceId = nonEmptyEnv(resolveMCPDriveSpaceId());
  const parentNodeId = nonEmptyEnv(resolveMCPDriveParentNodeId());
  return createDriveUploadImageService({
    uploader: driveClient.uploader,
    declaration: MCP_SERVER_ICON_UPLOAD,
    previewReader: createDriveNodesImagePreviewReader(driveClient.drive.nodes),
    ...(spaceId === undefined ? {} : { spaceId }),
    ...(parentNodeId === undefined ? {} : { parentNodeId }),
  });
}
