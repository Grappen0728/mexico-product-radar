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

function requireFiniteNumber(value: unknown, label: string, options: { positive?: boolean } = {}): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label}必须是有效数字`);
  if (options.positive ? value <= 0 : value < 0) throw new Error(`${label}${options.positive ? "必须大于0" : "不能为负数"}`);
}

function validateMonthlyRevenueEstimate(value: unknown): void {
  if (!isObject(value)) throw new Error("单链接月销售额预估格式无效");
  if (value.status === "unavailable") {
    requireString(value.unavailableReason, "无法估算原因");
    return;
  }
  if (value.status !== "available") throw new Error("月销售额预估状态无效");

  requireHttps(value.sourceProductUrl, "月销售额商品链接");
  requireString(value.period, "月销售额估算周期");
  if (!/^\d{4}-\d{2}$/.test(value.period)) throw new Error("月销售额估算周期必须使用 YYYY-MM");
  requireFiniteNumber(value.estimatedMonthlyUnitsMin, "月销量下限");
  requireFiniteNumber(value.estimatedMonthlyUnitsMax, "月销量上限");
  if (value.estimatedMonthlyUnitsMin > value.estimatedMonthlyUnitsMax) throw new Error("月销量上下限顺序无效");
  requireFiniteNumber(value.unitPrice, "商品单价", { positive: true });
  requireString(value.unitPriceCurrency, "商品单价币种");
  if (!(value.unitPriceCurrency === "MXN" || value.unitPriceCurrency === "USD")) throw new Error("商品单价币种仅支持 MXN 或 USD");

  if (value.unitPriceCurrency === "MXN") {
    requireFiniteNumber(value.mxnPerUsd, "美元汇率", { positive: true });
    requireHttps(value.fxSourceUrl, "汇率来源链接");
    requireString(value.fxPublisher, "汇率发布方");
    requireString(value.fxCapturedAt, "汇率日期");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.fxCapturedAt)) throw new Error("汇率日期必须使用 YYYY-MM-DD");
  }

  requireString(value.method, "月销售额估算方法");
  if (!(value.confidence === "high" || value.confidence === "medium" || value.confidence === "low")) throw new Error("月销售额可信度无效");
  if (!Array.isArray(value.sourceUrls) || value.sourceUrls.length === 0) throw new Error("月销售额至少需要一个来源链接");
  value.sourceUrls.forEach((url, index) => requireHttps(url, `月销售额来源${index + 1}`));
}

function isGenericMediaPage(value: string): boolean {
  const url = new URL(value);
  return url.pathname === "/results"
    || url.pathname.startsWith("/tag/")
    || url.pathname.startsWith("/search");
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
  if (value.monthlyRevenueEstimate !== undefined) validateMonthlyRevenueEstimate(value.monthlyRevenueEstimate);

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
    if (item.accessState === "available") {
      if (item.direct !== true) throw new Error(`素材${index + 1}可访问时必须是具体媒体页`);
      if (isGenericMediaPage(item.url as string)) throw new Error("搜索或标签页不能作为直接媒体");
      requireString(item.checkedAt, `素材${index + 1}最后核查时间`);
      requireString(item.sourceTitle, `素材${index + 1}来源`);
    }
  });

  if (!Array.isArray(value.sources) || value.sources.length === 0) throw new Error("至少需要一个公开来源");
  value.sources.forEach((item, index) => validateSource(item, `来源${index + 1}`));

  return value as unknown as RecommendationReport;
}
