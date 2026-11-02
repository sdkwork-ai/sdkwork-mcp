export interface CreateMcpServerCommand {
  server_key: string;
  name: string;
  description?: string;
  transport: string;
  visibility?: string;
  category_id?: string;
  category_code?: string;
  tags?: string[];
  /** IAM role codes allowed to see and use this server. An empty list means every role (the default). */
  allowed_role_codes?: string[];
  icon_ref?: string;
}
