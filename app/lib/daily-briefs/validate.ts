import { validateReport } from "../recommendations/validate";
import { CHANNEL_PLATFORM, DAILY_CHANNELS, type DailyPlatformBrief, type OpportunityScores } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label}不能为空`);
}

function requireStrings(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${label}至少需要一项`);
  }
}

function validateScores(value: unknown): asserts value is OpportunityScores {
  if (!isObject(value)) throw new Error("机会评分不能为空");
  const keys: (keyof OpportunityScores)[] = [
    "demand",
    "competitionOpportunity",
    "profit",
    "platformFit",
    "contentOrSalesPotential",
    "riskControl",
  ];
  for (const key of keys) {
    const score = value[key];
    if (!Number.isInteger(score) || (score as number) < 1 || (score as number) > 5) {
      throw new Error(key === "competitionOpportunity" ? "竞争机会评分必须为1到5" : `${key}评分必须为1到5`);
    }
  }
}

export function validateDailyBrief(value: unknown): DailyPlatformBrief {
  if (!isObject(value)) throw new Error("日报必须是对象");
  requireString(value.date, "日报日期");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) throw new Error("日报日期必须使用YYYY-MM-DD");
  requireString(value.slug, "日报链接标识");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) throw new Error("日报链接标识格式无效");
  requireString(value.sourcesCheckedAt, "来源核查时间");

  if (!Array.isArray(value.recommendations) || value.recommendations.length !== 3) {
    throw new Error("每日必须包含三个平台推荐");
  }

  const productSlugs = new Set<string>();
  value.recommendations.forEach((item, index) => {
    if (!isObject(item)) throw new Error(`平台推荐${index + 1}格式无效`);
    if (item.channel !== DAILY_CHANNELS[index]) throw new Error("平台顺序必须为TikTok、Amazon、Mercado Libre");
    const channel = DAILY_CHANNELS[index];
    const report = validateReport(item.report);
    if (!report.platforms.includes(CHANNEL_PLATFORM[channel])) throw new Error("产品平台标识与日报频道不一致");
    if (productSlugs.has(report.slug)) throw new Error("三个产品不能重复");
    productSlugs.add(report.slug);
    requireString(item.whyRecommended, "推荐理由");
    requireStrings(item.analysis, "平台分析");
    validateScores(item.scores);
    requireStrings(item.platformPlaybook, "平台打法");
    if (!isObject(item.commercialModel)) throw new Error("商业模型不能为空");
    requireString(item.commercialModel.purchaseCost, "采购成本");
    requireString(item.commercialModel.suggestedPrice, "建议售价");
    requireString(item.commercialModel.estimatedProfit, "预估利润");
    requireString(item.testAdvice, "测试建议");
  });

  if (!Array.isArray(value.ranking) || value.ranking.length !== 3) throw new Error("日报排名必须包含三项");
  const ranks = new Set<number>();
  const rankedProducts = new Set<string>();
  value.ranking.forEach((item) => {
    if (!isObject(item)) throw new Error("排名格式无效");
    if (![1, 2, 3].includes(item.rank as number)) throw new Error("排名必须为1到3");
    if (ranks.has(item.rank as number)) throw new Error("排名不能重复");
    ranks.add(item.rank as number);
    requireString(item.productSlug, "排名产品");
    if (!productSlugs.has(item.productSlug)) throw new Error("排名产品必须来自当日推荐");
    if (rankedProducts.has(item.productSlug)) throw new Error("排名产品不能重复");
    rankedProducts.add(item.productSlug);
    if (typeof item.score !== "number" || item.score < 0 || item.score > 100) throw new Error("排名分数必须为0到100");
    requireString(item.reason, "排名理由");
  });

  if (!isObject(value.priorityPick)) throw new Error("优先测试产品不能为空");
  requireString(value.priorityPick.productSlug, "优先测试产品");
  requireString(value.priorityPick.reason, "优先测试理由");
  const top = value.ranking.find((item) => isObject(item) && item.rank === 1);
  if (!top || top.productSlug !== value.priorityPick.productSlug) throw new Error("优先测试产品必须等于TOP 1");

  return value as unknown as DailyPlatformBrief;
}
