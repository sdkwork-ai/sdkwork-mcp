export interface McpServerRecord {
  id: string;
  uuid: string;
  server_key: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  category_code?: string | null;
  transport: string;
  visibility: string;
  data_scope: string;
  health_status: string;
  lifecycle_status: string;
  tags?: string[];
  /** IAM role codes allowed to see and use this server. An empty list means every role (the default). */
  allowed_role_codes: string[];
  /** Canonical sdkwork-drive node reference. */
  icon_ref?: string | null;
}
