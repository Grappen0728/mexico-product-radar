import type { DailyPlatformBrief, DailyChannel, PlatformRecommendation } from "../../app/lib/daily-briefs/types";
import type { Platform } from "../../app/lib/recommendations/types";
import { makeReport } from "./report";

const PRODUCTS = [
  { channel: "tiktok-mx", platform: "TK", slug: "mini-thermal-printer", zh: "迷你蓝牙热敏打印机" },
  { channel: "amazon-mx", platform: "AMZ", slug: "smart-air-quality-monitor", zh: "智能空气质量监测仪" },
  { channel: "mercado-libre-mx", platform: "MKD", slug: "portable-tire-inflator", zh: "便携式数显充气泵" },
] as const;

function makeRecommendation(
  item: { channel: DailyChannel; platform: Platform; slug: string; zh: string },
): PlatformRecommendation {
  return {
    channel: item.channel,
    report: makeReport({
      slug: item.slug,
      product: { zh: item.zh, es: item.zh, keywords: [item.slug] },
      platforms: [item.platform],
    }),
    whyRecommended: "需求清晰，演示效果直接，并有可验证的公开市场信号。",
    analysis: ["解决明确痛点", "产品功能易理解", "适合该平台消费者"],
    scores: {
      demand: 4,
      competitionOpportunity: 4,
      profit: 4,
      platformFit: 5,
      contentOrSalesPotential: 5,
      riskControl: 3,
    },
    platformPlaybook: ["用痛点开场", "展示使用前后效果", "给出明确购买理由"],
    commercialModel: {
      purchaseCost: "US$8–12（供应端询价区间）",
      suggestedPrice: "MXN 499–699",
      estimatedProfit: "需按真实物流和平台费复核",
      suitableCommission: "10%–15%",
      targetRoi: "首轮以回收成本为目标",
    },
    testAdvice: "建议先用小库存和三组素材测试。",
  };
}

export function makeDailyBrief(): DailyPlatformBrief {
  const recommendations = PRODUCTS.map((item) => makeRecommendation(item));
  return {
    date: "2026-07-14",
    slug: "2026-07-14",
    recommendations,
    ranking: [
      { productSlug: recommendations[0].report.slug, rank: 1, score: 88, reason: "内容传播和转化路径最清晰" },
      { productSlug: recommendations[1].report.slug, rank: 2, score: 83, reason: "稳定搜索需求较好" },
      { productSlug: recommendations[2].report.slug, rank: 3, score: 79, reason: "本地需求明确" },
    ],
    priorityPick: {
      productSlug: recommendations[0].report.slug,
      reason: "低成本即可验证内容和成交。",
    },
    sourcesCheckedAt: "2026-07-14T10:00:00+08:00",
  };
}
