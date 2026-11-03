-- SDKWork official agent catalog: zh-CN MCP catalog display.

-- Catalog revision: 1.2.1.

BEGIN;

SELECT set_config('app.current_tenant_id', '100001', true);

SELECT set_config('app.current_organization_id', '0', true);

UPDATE ai_mcp_server_category SET
  name = '工程技术',
  description = 'Code, infrastructure, and engineering delivery tools.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'engineering';

UPDATE ai_mcp_server_category SET
  name = '教育学习',
  description = 'Curriculum, textbooks, exams, and learning resources.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'education';

UPDATE ai_mcp_server_category SET
  name = '医疗健康',
  description = 'Clinical guidance, drug references, and medical evidence.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'healthcare';

UPDATE ai_mcp_server_category SET
  name = '法律法务',
  description = 'Statutes, cases, regulations, and legal research.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'legal';

UPDATE ai_mcp_server_category SET
  name = '旅游出行',
  description = 'Flights, hotels, points of interest, transit, and weather.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'travel';

UPDATE ai_mcp_server_category SET
  name = '电商零售',
  description = 'Catalog, traffic, conversion, advertising, and after-sales data.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'ecommerce';

UPDATE ai_mcp_server_category SET
  name = '房产家居',
  description = 'Listings, comparables, community data, and property policy.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'realestate';

UPDATE ai_mcp_server_category SET
  name = '餐饮食品',
  description = 'Menu costing, POS, suppliers, inventory, and food safety.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'restaurant';

UPDATE ai_mcp_server_category SET
  name = '企业服务',
  description = 'Registration, tax, HR, qualification, and B2B references.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'enterprise';

UPDATE ai_mcp_server_category SET
  name = '政务公共服务',
  description = 'Official policy, service guides, and administrative procedures.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'government';

UPDATE ai_mcp_server_category SET
  name = '酒店住宿',
  description = 'Room inventory, rates, OTA channels, and guest experience.',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND category_code = 'hospitality';

UPDATE ai_mcp_server SET
  name = '联网研究',
  description = '检索公开网络、打开权威页面、提取事实并保留来源链接，用于需要实时信息的研究任务。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.web-research';

UPDATE ai_mcp_server SET
  name = '代码仓库',
  description = '读取仓库结构、检索代码、查看议题与合并请求，并追踪实现证据。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.code-repository';

UPDATE ai_mcp_server SET
  name = '文档检索',
  description = '检索产品文档、API 参考、标准与内部运行手册，并关注版次差异。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.docs-knowledge';

UPDATE ai_mcp_server SET
  name = '课程标准与题库',
  description = '查询课程标准、教材范围、考试蓝本与年级知识边界。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.curriculum';

UPDATE ai_mcp_server SET
  name = '医学证据',
  description = '检索临床指南、药品说明书、系统综述与患者教育资料，并保留出处。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.medical-evidence';

UPDATE ai_mcp_server SET
  name = '法律检索',
  description = '检索法律、司法解释、案例与监管指引，并核对管辖与生效日期。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.legal-research';

UPDATE ai_mcp_server SET
  name = '旅行库存',
  description = '从实时库存源查询航班、酒店、景点、交通、天气与营业时间。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.travel-inventory';

UPDATE ai_mcp_server SET
  name = '电商分析',
  description = '读取已连接电商账号的商品、流量、转化、广告与售后指标。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.commerce-analytics';

UPDATE ai_mcp_server SET
  name = '房产数据',
  description = '读取房源、成交可比、小区属性与地方政策参考，用于房产分析。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.property-data';

UPDATE ai_mcp_server SET
  name = '计算与建模',
  description = '执行确定性算术、单位换算、房贷、税费、投资回报与情景模型，避免心算误差。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.calculator';

UPDATE ai_mcp_server SET
  name = '文件与文档',
  description = '解析上传文档、提取表格、生成交付物，并保留原始结构。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.file-tools';

UPDATE ai_mcp_server SET
  name = '翻译与本地化',
  description = '在术语控制、地区惯例与回译校验下翻译高风险内容。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.translation';

UPDATE ai_mcp_server SET
  name = '餐饮运营',
  description = '读取菜单成本、POS 销售、供应商价格、库存、食品安全检查表与平台评价数据。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.restaurant-operations';

UPDATE ai_mcp_server SET
  name = '企业服务',
  description = '查询工商注册、税务、人力资源政策、资质与 B2B 服务资料，并核对适用地区。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.enterprise-services';

UPDATE ai_mcp_server SET
  name = '政务政策',
  description = '检索官方政策文件、办事指南、行政流程与生效日期元数据。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.government-policy';

UPDATE ai_mcp_server SET
  name = '酒店库存',
  description = '读取房态库存、价格、限制条件、OTA 渠道、住客评价与酒店设施信息。',
  updated_at = TIMESTAMPTZ '2026-11-03T00:00:00+08:00'
WHERE tenant_id = 100001 AND server_key = 'mcp.sdkwork.hotel-inventory';

COMMIT;
