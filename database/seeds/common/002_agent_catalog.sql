-- SDKWork official agent catalog: MCP server identities (neutral base).

-- Catalog revision: 1.2.1.

-- Entries are catalog drafts. A tenant admin activates a connector with the

-- approved endpoint and credentials before any tool is exposed to a turn.

BEGIN;

SELECT set_config('app.current_tenant_id', '100001', true);

SELECT set_config('app.current_organization_id', '0', true);

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000001, '2c2910b0-8d7c-4553-82ca-865f18ccc10e', 100001, 0,
  'engineering', 'engineering', NULL, 0, 1, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000002, '42979a76-2a2b-4e73-8f94-6281896feed9', 100001, 0,
  'education', 'education', NULL, 0, 2, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000003, '827d2cea-22da-45b1-82f6-2434b5f48812', 100001, 0,
  'healthcare', 'healthcare', NULL, 0, 3, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000004, '849a3d3c-b68d-4e32-8e1b-66d9cf83f6ff', 100001, 0,
  'legal', 'legal', NULL, 0, 4, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000005, '5adbfcdf-5c5d-430c-8994-4c497668d7aa', 100001, 0,
  'travel', 'travel', NULL, 0, 5, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000006, '798f0264-b631-4f76-8076-f9f1fab5722f', 100001, 0,
  'ecommerce', 'ecommerce', NULL, 0, 6, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000007, '8dac0e39-f6b3-4256-8317-31f9d734cda2', 100001, 0,
  'realestate', 'realestate', NULL, 0, 7, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000008, 'edfcd4cd-6a5f-4ccc-8fb9-ae4acbdb8ec2', 100001, 0,
  'restaurant', 'restaurant', NULL, 0, 8, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000009, '4aac2da7-d4ee-4b18-8e89-921067f9dff4', 100001, 0,
  'enterprise', 'enterprise', NULL, 0, 9, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000010, '1bab4e74-afa3-47f0-8227-2118b3c350b9', 100001, 0,
  'government', 'government', NULL, 0, 10, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server_category (
  id, uuid, tenant_id, organization_id, category_code, name, description, parent_id,
  sort_order, lifecycle_status, version, created_at, updated_at, created_by, updated_by
) VALUES (
  539000000000000011, '2e96c9b4-5295-4873-8b68-4f5d3a53e26f', 100001, 0,
  'hospitality', 'hospitality', NULL, 0, 11, 1, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, category_code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  lifecycle_status = EXCLUDED.lifecycle_status,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000001, '4d820eba-433f-45bc-8309-6c3cf3366923', 100001, 0, 1,
  'mcp.sdkwork.web-research', 'mcp.sdkwork.web-research', NULL,
  'research', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["web","search","citation"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000002, '3cd3404f-d0d6-44d4-8ba5-3a71a3a6f40e', 100001, 0, 1,
  'mcp.sdkwork.code-repository', 'mcp.sdkwork.code-repository', NULL,
  'engineering', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["code","repository","review"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000003, 'f3531c44-4504-452f-846f-34ce1ec9d1a1', 100001, 0, 1,
  'mcp.sdkwork.docs-knowledge', 'mcp.sdkwork.docs-knowledge', NULL,
  'research', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["docs","api","standards"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000004, 'bff794af-e68c-4d75-80a8-42b30959d61d', 100001, 0, 1,
  'mcp.sdkwork.curriculum', 'mcp.sdkwork.curriculum', NULL,
  'education', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["curriculum","exam","textbook"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000005, '057b2c17-c033-448b-8d28-7bc5694f663f', 100001, 0, 1,
  'mcp.sdkwork.medical-evidence', 'mcp.sdkwork.medical-evidence', NULL,
  'healthcare', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["guideline","drug-label","evidence"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000006, '01d4f57a-92ff-4048-861b-ae37dbcb8ad5', 100001, 0, 1,
  'mcp.sdkwork.legal-research', 'mcp.sdkwork.legal-research', NULL,
  'legal', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["statute","case","regulation"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000007, 'ac0d74a6-4490-4e08-8dde-9b582961e94d', 100001, 0, 1,
  'mcp.sdkwork.travel-inventory', 'mcp.sdkwork.travel-inventory', NULL,
  'travel', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["flight","hotel","poi"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000008, 'd07210f7-c9a7-42ee-8419-03fe391fd722', 100001, 0, 1,
  'mcp.sdkwork.commerce-analytics', 'mcp.sdkwork.commerce-analytics', NULL,
  'ecommerce', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["catalog","traffic","ads"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000009, '9bc35708-a1d6-4007-82f0-55d0cebfd64e', 100001, 0, 1,
  'mcp.sdkwork.property-data', 'mcp.sdkwork.property-data', NULL,
  'realestate', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["listing","comparable","policy"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000010, '659db0fc-05a9-44a8-86da-3cef00f1e19b', 100001, 0, 1,
  'mcp.sdkwork.calculator', 'mcp.sdkwork.calculator', NULL,
  'analysis', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["calculator","model","scenario"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000011, 'e133cdcb-2ad9-49f4-8ed2-804e7b5c0207', 100001, 0, 1,
  'mcp.sdkwork.file-tools', 'mcp.sdkwork.file-tools', NULL,
  'productivity', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["file","document","table"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000012, '34aac815-92ba-4ed8-8ce9-a83519248564', 100001, 0, 1,
  'mcp.sdkwork.translation', 'mcp.sdkwork.translation', NULL,
  'language', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["translation","terminology","locale"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000013, 'bb730a7c-555c-407f-83c5-ebb2ff2bcd42', 100001, 0, 1,
  'mcp.sdkwork.restaurant-operations', 'mcp.sdkwork.restaurant-operations', NULL,
  'restaurant', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["menu","food-safety","pos","supplier"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000014, '007c51d4-9620-4600-81d1-8849df6602c6', 100001, 0, 1,
  'mcp.sdkwork.enterprise-services', 'mcp.sdkwork.enterprise-services', NULL,
  'enterprise', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["registration","tax","hr","qualification"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000015, '8ac4cc6c-eebb-489c-8b19-e21073768d9d', 100001, 0, 1,
  'mcp.sdkwork.government-policy', 'mcp.sdkwork.government-policy', NULL,
  'government', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["policy","service-guide","regulation"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_server (
  id, uuid, tenant_id, organization_id, owner_user_id, server_key, name, description,
  category_code, transport, visibility, data_scope, health_status, lifecycle_status,
  tags_json, allowed_role_codes, created_at, updated_at, version, created_by, updated_by
) VALUES (
  535000000000000016, '910984f0-8505-4fca-8762-05b7675250c3', 100001, 0, 1,
  'mcp.sdkwork.hotel-inventory', 'mcp.sdkwork.hotel-inventory', NULL,
  'hospitality', 'streamable-http', 'tenant', 3, 'unknown', 0,
  '["pms","rate","ota","guest"]'::jsonb, '[]'::jsonb, TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 0, 1, 1
)
ON CONFLICT (tenant_id, server_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_code = EXCLUDED.category_code,
  transport = EXCLUDED.transport,
  visibility = EXCLUDED.visibility,
  data_scope = EXCLUDED.data_scope,
  tags_json = EXCLUDED.tags_json,
  allowed_role_codes = EXCLUDED.allowed_role_codes,
  updated_at = EXCLUDED.updated_at
;

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000001, 'b6a84e13-e120-4ca6-8ecd-08e964558e6b', 100001, 0,
  535000000000000001, 'connector.web-research', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000001,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.web-research'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000001);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000002, '07a5a9c2-13ee-4c9b-8b98-867cca3165a8', 100001, 0,
  535000000000000002, 'connector.code-repository', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000002,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.code-repository'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000002);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000003, '3222d769-a91d-428e-8329-d1193f8d81e6', 100001, 0,
  535000000000000003, 'connector.docs-knowledge', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000003,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.docs-knowledge'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000003);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000004, '8c577bcb-b15c-455c-8371-cc7b5ead530e', 100001, 0,
  535000000000000004, 'connector.curriculum', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000004,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.curriculum'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000004);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000005, 'd0aee073-cb97-4f06-81f8-e424b7604468', 100001, 0,
  535000000000000005, 'connector.medical-evidence', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000005,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.medical-evidence'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000005);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000006, '0b12be44-88e8-476c-86bf-849cf100b268', 100001, 0,
  535000000000000006, 'connector.legal-research', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000006,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.legal-research'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000006);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000007, 'a317acb9-e500-4f61-8144-a86f16af9201', 100001, 0,
  535000000000000007, 'connector.travel-inventory', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000007,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.travel-inventory'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000007);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000008, '05b98f8c-29aa-4e69-8350-5eccc3d41d6d', 100001, 0,
  535000000000000008, 'connector.commerce-analytics', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000008,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.commerce-analytics'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000008);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000009, '1382eae2-7644-4c83-8204-b52ad923ef38', 100001, 0,
  535000000000000009, 'connector.property-data', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000009,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.property-data'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000009);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000010, 'ae29cd74-9c04-484c-8fe8-4474fd15851c', 100001, 0,
  535000000000000010, 'connector.calculator', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000010,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.calculator'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000010);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000011, '39a4c932-7d82-41b2-85a6-abaa42194838', 100001, 0,
  535000000000000011, 'connector.file-tools', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000011,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.file-tools'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000011);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000012, '5e91b158-4369-4851-8eec-9dc351d00dea', 100001, 0,
  535000000000000012, 'connector.translation', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000012,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.translation'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000012);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000013, '102aa2a7-ba10-44c8-8971-450b85a969e0', 100001, 0,
  535000000000000013, 'connector.restaurant-operations', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000013,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.restaurant-operations'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000013);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000014, 'e2a20808-8e4f-4548-8a2e-c8fa094b66c3', 100001, 0,
  535000000000000014, 'connector.enterprise-services', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000014,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.enterprise-services'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000014);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000015, '95980dde-601d-4baf-8b8d-ae71f89a0755', 100001, 0,
  535000000000000015, 'connector.government-policy', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000015,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.government-policy'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000015);

INSERT INTO ai_mcp_connector (
  id, uuid, tenant_id, organization_id, server_id, connector_key, publish_status,
  transport, endpoint_url, command_ref, args_json, env_schema_json, auth_type,
  secret_ref, timeout_ms, retry_policy_json, config_hash, lifecycle_status, version,
  created_at, updated_at, created_by, updated_by
) VALUES (
  538000000000000016, 'b33d07c8-4ffc-4bf1-88d0-49428279c021', 100001, 0,
  535000000000000016, 'connector.hotel-inventory', 'draft', 'streamable-http', NULL, NULL,
  '[]'::jsonb, '{}'::jsonb, 'none', NULL, 30000,
  '{"maxAttempts":3,"backoff":"exponential"}'::jsonb, NULL, 0, 0,
  TIMESTAMPTZ '2026-11-03T00:00:00+08:00', TIMESTAMPTZ '2026-11-03T00:00:00+08:00', 1, 1
)
ON CONFLICT (tenant_id, server_id, connector_key) DO NOTHING
;

UPDATE ai_mcp_server SET
  latest_connector_id = 538000000000000016,
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.hotel-inventory'
  AND (latest_connector_id IS NULL OR latest_connector_id = 538000000000000016);

COMMIT;
