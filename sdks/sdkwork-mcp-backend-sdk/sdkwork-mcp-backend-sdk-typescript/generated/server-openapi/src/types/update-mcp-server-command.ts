export interface UpdateMcpServerCommand {
  name?: string;
  description?: string;
  transport?: string;
  visibility?: string;
  category_id?: string;
  category_code?: string;
  tags?: string[];
  /** Full replacement role-code list. Omitted leaves the assignment unchanged; an empty list means every role. */
  allowed_role_codes?: string[];
  icon_ref?: string;
  lifecycle_status?: string;
}
