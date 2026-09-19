import type { DriveUploaderProfile } from '@sdkwork/drive-app-sdk';
import type { SdkworkDriveAppClient } from '@sdkwork/drive-app-sdk';
import { formatDrivePackageRef } from '@sdkwork/mcp-pc-commons/driveUri';
import {
  resolveMCPDriveParentNodeId,
  resolveMCPDriveSpaceId,
} from '@sdkwork/mcp-pc-commons/runtime';

import { MCP_SERVER_ASSET_UPLOAD, MCP_SERVER_ICON_UPLOAD } from '../sdk/uploadDeclaration';

/**
 * `appResourceType`, `scene`, and `source` are not accepted here: they are the application's
 * upload identity, owned by `specs/upload.declaration.json` and consumed from
 * `../sdk/uploadDeclaration` (DRIVE_SPEC.md section 18.3). A caller combines none of them.
 * `uploadProfileCode` stays overridable because the profile follows the content shape
 * (DRIVE_SPEC.md section 18.3), and defaults to the declared value.
 */
export type DriveAssetUploadOptions = {
  spaceId?: string;
  parentNodeId?: string;
  uploadProfileCode?: DriveUploaderProfile;
};

export async function uploadDriveAsset(
  driveClient: SdkworkDriveAppClient,
  file: File,
  options: DriveAssetUploadOptions = {},
): Promise<string> {
  const spaceId = options.spaceId ?? resolveMCPDriveSpaceId();
  if (!spaceId) {
    throw new Error(
      'VITE_SDKWORK_MCP_DRIVE_SPACE_ID is required before uploading assets through sdkwork-drive.',
    );
  }

  const uploadResult = await driveClient.uploader.upload({
    file,
    appResourceType: MCP_SERVER_ASSET_UPLOAD.appResourceType,
    appResourceId: file.name,
    scene: MCP_SERVER_ASSET_UPLOAD.scene,
    source: MCP_SERVER_ASSET_UPLOAD.source,
    spaceId,
    parentNodeId: options.parentNodeId ?? resolveMCPDriveParentNodeId(),
    uploadProfileCode: options.uploadProfileCode ?? MCP_SERVER_ASSET_UPLOAD.uploadProfileCode,
    originalFileName: file.name,
    contentType: file.type || 'application/octet-stream',
  });

  return formatDrivePackageRef(uploadResult.uploadItem.spaceId, uploadResult.uploadItem.nodeId);
}

export async function uploadServerIcon(
  driveClient: SdkworkDriveAppClient,
  file: File,
): Promise<string> {
  return uploadDriveAsset(driveClient, file, {
    uploadProfileCode: MCP_SERVER_ICON_UPLOAD.uploadProfileCode,
  });
}
