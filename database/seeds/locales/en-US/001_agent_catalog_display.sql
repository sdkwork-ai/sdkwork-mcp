-- SDKWork official agent catalog: en-US MCP catalog display.

-- Catalog revision: 1.2.1.

BEGIN;

SELECT set_config('app.current_tenant_id', '100001', true);

SELECT set_config('app.current_organization_id', '0', true);

UPDATE ai_mcp_server_category SET
  name = 'Engineering',
  description = 'Code, infrastructure, and engineering delivery tools.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'engineering';

UPDATE ai_mcp_server_category SET
  name = 'Education',
  description = 'Curriculum, textbooks, exams, and learning resources.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'education';

UPDATE ai_mcp_server_category SET
  name = 'Healthcare',
  description = 'Clinical guidance, drug references, and medical evidence.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'healthcare';

UPDATE ai_mcp_server_category SET
  name = 'Legal',
  description = 'Statutes, cases, regulations, and legal research.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'legal';

UPDATE ai_mcp_server_category SET
  name = 'Travel',
  description = 'Flights, hotels, points of interest, transit, and weather.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'travel';

UPDATE ai_mcp_server_category SET
  name = 'E-commerce',
  description = 'Catalog, traffic, conversion, advertising, and after-sales data.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'ecommerce';

UPDATE ai_mcp_server_category SET
  name = 'Real Estate',
  description = 'Listings, comparables, community data, and property policy.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'realestate';

UPDATE ai_mcp_server_category SET
  name = 'Restaurant and F&B',
  description = 'Menu costing, POS, suppliers, inventory, and food safety.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'restaurant';

UPDATE ai_mcp_server_category SET
  name = 'Enterprise Services',
  description = 'Registration, tax, HR, qualification, and B2B references.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'enterprise';

UPDATE ai_mcp_server_category SET
  name = 'Government and Public Service',
  description = 'Official policy, service guides, and administrative procedures.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'government';

UPDATE ai_mcp_server_category SET
  name = 'Hotel and Hospitality',
  description = 'Room inventory, rates, OTA channels, and guest experience.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'hospitality';

UPDATE ai_mcp_server SET
  name = 'Web Research',
  description = 'Search the public web, open authoritative pages, extract facts, and preserve source URLs for citation.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.web-research';

UPDATE ai_mcp_server SET
  name = 'Code Repository',
  description = 'Read repository structure, search code, inspect issues and pull requests, and trace implementation evidence.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.code-repository';

UPDATE ai_mcp_server SET
  name = 'Documentation Search',
  description = 'Search product documentation, API references, standards, and internal runbooks with version awareness.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.docs-knowledge';

UPDATE ai_mcp_server SET
  name = 'Curriculum and Standards',
  description = 'Look up curriculum standards, textbook scope, exam blueprints, and grade-level knowledge boundaries.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.curriculum';

UPDATE ai_mcp_server SET
  name = 'Medical Evidence',
  description = 'Retrieve clinical guidelines, drug labels, systematic reviews, and patient-education sources with provenance.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.medical-evidence';

UPDATE ai_mcp_server SET
  name = 'Legal Research',
  description = 'Search statutes, judicial interpretations, cases, and regulator guidance with jurisdiction and effective-date checks.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.legal-research';

UPDATE ai_mcp_server SET
  name = 'Travel Inventory',
  description = 'Query flights, hotels, points of interest, transit, weather, and opening hours from live inventory sources.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.travel-inventory';

UPDATE ai_mcp_server SET
  name = 'Commerce Analytics',
  description = 'Read product, traffic, conversion, advertising, and after-sales metrics from connected commerce accounts.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.commerce-analytics';

UPDATE ai_mcp_server SET
  name = 'Property Data',
  description = 'Read listings, transaction comparables, community attributes, and local policy references for property analysis.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.property-data';

UPDATE ai_mcp_server SET
  name = 'Calculator and Modeling',
  description = 'Run deterministic arithmetic, unit conversion, mortgage, tax, ROI, and scenario models without mental math.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.calculator';

UPDATE ai_mcp_server SET
  name = 'File and Document Tools',
  description = 'Parse uploaded documents, extract tables, generate deliverables, and preserve source structure.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.file-tools';

UPDATE ai_mcp_server SET
  name = 'Translation and Localization',
  description = 'Translate with terminology control, locale conventions, and back-translation checks for high-stakes content.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.translation';

UPDATE ai_mcp_server SET
  name = 'Restaurant Operations',
  description = 'Read menu costing, POS sales, supplier prices, inventory, food-safety checklists, and platform review data.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.restaurant-operations';

UPDATE ai_mcp_server SET
  name = 'Enterprise Services',
  description = 'Look up business registration, tax, HR policy, qualification, and B2B service references with jurisdiction checks.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.enterprise-services';

UPDATE ai_mcp_server SET
  name = 'Government Policy',
  description = 'Retrieve official policy documents, service guides, administrative procedures, and effective-date metadata.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.government-policy';

UPDATE ai_mcp_server SET
  name = 'Hotel Inventory',
  description = 'Read room inventory, rates, restrictions, OTA channel data, guest reviews, and property facilities.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.hotel-inventory';

COMMIT;
