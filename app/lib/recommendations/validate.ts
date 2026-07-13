import { isPlatform, type RecommendationReport, type SourceLink } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label}不能为空`);
  }
}

function requireStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${label}至少需要一项有效内容`);
  }
}

function requireHttps(url: unknown, label: string): void {
  requireString(url, label);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label}必须是有效的 HTTPS 地址`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${label}必须使用 HTTPS`);
  }
}

function validateSource(source: unknown, label: string): asserts source is SourceLink {
  if (!isObject(source)) throw new Error(`${label}格式无效`);
  requireString(source.title, `${label}标题`);
  requireHttps(source.url, `${label}链接`);
  requireString(source.capturedAt, `${label}抓取日期`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.capturedAt)) {
    throw new Error(`${label}抓取日期必须使用 YYYY-MM-DD`);
  }
}

export function validateReport(value: unknown): RecommendationReport {
  if (!isObject(value)) throw new Error("报告必须是一个对象");
  requireString(value.date, "报告日期");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) throw new Error("报告日期必须使用 YYYY-MM-DD");
  requireString(value.slug, "公开链接标识");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) throw new Error("公开链接标识只能使用小写字母、数字和连字符");

  if (!isObject(value.product)) throw new Error("产品名称不能为空");
  requireString(value.product.zh, "中文产品名");
  requireString(value.product.es, "西语产品名");
  requireStringArray(value.product.keywords, "英文关键词");
  requireString(value.category, "产品类别");
  requireStringArray(value.scenarios, "使用场景");
  requireStringArray(value.audience, "目标人群");

  if (!Array.isArray(value.platforms) || value.platforms.length === 0 || value.platforms.some((item) => typeof item !== "string" || !isPlatform(item))) {
    throw new Error("平台必须从 TK、MKD、TM 中选择至少一项");
  }
  if (!isObject(value.metrics)) throw new Error("基础数据不能为空");
  requireString(value.metrics.currency, "价格币种");

  if (!isObject(value.trend)) throw new Error("趋势判断不能为空");
  if (!(["hot", "rising", "stable"] as unknown[]).includes(value.trend.status)) throw new Error("趋势状态无效");
  requireString(value.trend.label, "趋势标签");
  if (!Array.isArray(value.trend.evidence) || value.trend.evidence.length < 2) throw new Error("至少需要两条趋势证据");
  value.trend.evidence.forEach((item, index) => {
    validateSource(item, `趋势证据${index + 1}`);
    requireString((item as unknown as Record<string, unknown>).signal, `趋势证据${index + 1}信号`);
  });

  requireStringArray(value.reasons, "推荐理由");
  if (!isObject(value.supplyChain)) throw new Error("供应链提示不能为空");
  if (!isObject(value.electronics)) throw new Error("带电带芯片信息不能为空");
  requireString(value.electronics.battery, "电池信息");
  requireString(value.electronics.charging, "充电规格");
  requireString(value.electronics.chip, "芯片信息");
  requireStringArray(value.risks, "风险提示");
  requireString(value.nextAction, "下一步动作");
  if (!(["recommend", "watch", "reject"] as unknown[]).includes(value.verdict)) throw new Error("推荐结论无效");

  if (!Array.isArray(value.media)) throw new Error("素材必须是数组");
  value.media.forEach((item, index) => {
    if (!isObject(item)) throw new Error(`素材${index + 1}格式无效`);
    if (!(["image", "video"] as unknown[]).includes(item.type)) throw new Error(`素材${index + 1}类型无效`);
    requireString(item.title, `素材${index + 1}标题`);
    requireHttps(item.url, `素材${index + 1}链接`);
    if (item.thumbnailUrl !== undefined) requireHttps(item.thumbnailUrl, `素材${index + 1}缩略图`);
  });

  if (!Array.isArray(value.sources) || value.sources.length === 0) throw new Error("至少需要一个公开来源");
  value.sources.forEach((item, index) => validateSource(item, `来源${index + 1}`));

  return value as unknown as RecommendationReport;
}
