import type { RecommendationReport } from "./recommendations/types";
import type { DailyPlatformBrief } from "./daily-briefs/types";
import { calculateMonthlyRevenueUsd, formatUsdRange } from "./recommendations/monthly-revenue";

export interface FeishuCardPayload {
  msg_type: "interactive";
  card: Record<string, unknown>;
  timestamp?: string;
  sign?: string;
}

const verdictLabels = {
  recommend: "推荐测试",
  watch: "继续观察",
  reject: "暂不建议",
} as const;

function priceLabel(report: RecommendationReport): string {
  return report.metrics.price === null
    ? "价格未公开"
    : `${report.metrics.currency} ${report.metrics.price}`;
}

function monthlyRevenueLabel(report: RecommendationReport): string {
  const result = calculateMonthlyRevenueUsd(report.monthlyRevenueEstimate);
  return result.status === "available"
    ? formatUsdRange(result.revenueUsdMin, result.revenueUsdMax)
    : `暂无可靠估算（${result.reason}）`;
}

export function buildFeishuCard(report: RecommendationReport, publicUrl: string): FeishuCardPayload {
  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: report.verdict === "recommend" ? "turquoise" : "blue",
        title: { tag: "plain_text", content: `墨西哥选品雷达｜${report.product.zh}` },
      },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**${report.trend.label} · ${verdictLabels[report.verdict]}**\n${report.platforms.join(" / ")} · ${priceLabel(report)}`,
          },
        },
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: report.reasons.slice(0, 2).map((reason) => `• ${reason}`).join("\n"),
          },
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              type: "primary",
              text: { tag: "plain_text", content: "查看完整报告" },
              url: publicUrl,
            },
          ],
        },
        {
          tag: "note",
          elements: [{ tag: "plain_text", content: `${report.date} · 公开资讯，仅供选品参考` }],
        },
      ],
    },
  };
}

async function createSignature(timestamp: string, secret: string): Promise<string> {
  const keyData = new TextEncoder().encode(`${timestamp}\n${secret}`);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new Uint8Array());
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function pushFeishuCard(options: {
  webhookUrl: string;
  signingSecret?: string;
  report: RecommendationReport;
  publicUrl: string;
  fetchFn?: typeof fetch;
  now?: () => number;
}): Promise<void> {
  const payload = buildFeishuCard(options.report, options.publicUrl);
  if (options.signingSecret) {
    const timestamp = String(Math.floor((options.now?.() ?? Date.now()) / 1000));
    payload.timestamp = timestamp;
    payload.sign = await createSignature(timestamp, options.signingSecret);
  }

  const response = await (options.fetchFn ?? fetch)(options.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({})) as { code?: number; msg?: string; StatusCode?: number; StatusMessage?: string };
  const accepted = response.ok && (result.code === 0 || result.StatusCode === 0);
  if (!accepted) {
    throw new Error(result.msg ?? result.StatusMessage ?? `飞书返回 HTTP ${response.status}`);
  }
}

const dailyChannelLabels = {
  "tiktok-mx": "TikTok Shop Mexico",
  "temu-mx": "Temu Mexico",
  "mercado-libre-mx": "Mercado Libre Mexico",
} as const;

export function buildDailyBriefFeishuCard(brief: DailyPlatformBrief, publicUrl: string): FeishuCardPayload {
  const top = brief.ranking.find((item) => item.rank === 1);
  const topRecommendation = brief.recommendations.find((item) => item.report.slug === top?.productSlug);
  const elements: Record<string, unknown>[] = brief.recommendations.flatMap((item) => [{
    tag: "div",
    text: {
      tag: "lark_md",
      content: `**${dailyChannelLabels[item.channel]}｜${item.report.product.zh}**\n${item.commercialModel.suggestedPrice}｜需求 ${"★".repeat(item.scores.demand)}｜竞争机会 ${"★".repeat(item.scores.competitionOpportunity)}\n**单链接月销售额预估：**${monthlyRevenueLabel(item.report)}\n${item.whyRecommended}`,
    },
  }, { tag: "hr" }]);
  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true },
      header: { template: "turquoise", title: { tag: "plain_text", content: `墨西哥三平台选品简报｜${brief.date}` } },
      elements: [
        ...elements,
        {
          tag: "div",
          text: { tag: "lark_md", content: `**TOP 1｜${topRecommendation?.report.product.zh ?? "未选出"}**\n${brief.priorityPick.reason}` },
        },
        {
          tag: "action",
          actions: [{ tag: "button", type: "primary", text: { tag: "plain_text", content: "查看完整三平台日报" }, url: publicUrl }],
        },
        { tag: "note", elements: [{ tag: "plain_text", content: `${brief.date} · 全部为公开资讯，价格、利润和投放参数请在测试前复核` }] },
      ],
    },
  };
}

export async function pushDailyBriefFeishuCard(options: {
  webhookUrl: string;
  signingSecret?: string;
  brief: DailyPlatformBrief;
  publicUrl: string;
  fetchFn?: typeof fetch;
  now?: () => number;
}): Promise<void> {
  const payload = buildDailyBriefFeishuCard(options.brief, options.publicUrl);
  if (options.signingSecret) {
    const timestamp = String(Math.floor((options.now?.() ?? Date.now()) / 1000));
    payload.timestamp = timestamp;
    payload.sign = await createSignature(timestamp, options.signingSecret);
  }
  const response = await (options.fetchFn ?? fetch)(options.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({})) as { code?: number; msg?: string; StatusCode?: number; StatusMessage?: string };
  if (!(response.ok && (result.code === 0 || result.StatusCode === 0))) {
    throw new Error(result.msg ?? result.StatusMessage ?? `飞书返回 HTTP ${response.status}`);
  }
}
