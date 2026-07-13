import type { RecommendationReport } from "../recommendations/types";

export const DAILY_CHANNELS = ["tiktok-mx", "temu-mx", "mercado-libre-mx"] as const;
export type DailyChannel = (typeof DAILY_CHANNELS)[number];

export interface OpportunityScores {
  demand: number;
  competitionOpportunity: number;
  profit: number;
  platformFit: number;
  contentOrSalesPotential: number;
  riskControl: number;
}

export interface PlatformRecommendation {
  channel: DailyChannel;
  report: RecommendationReport;
  whyRecommended: string;
  analysis: string[];
  scores: OpportunityScores;
  platformPlaybook: string[];
  commercialModel: {
    purchaseCost: string;
    suggestedPrice: string;
    estimatedProfit: string;
    suitableCommission?: string;
    targetRoi?: string;
  };
  testAdvice: string;
}

export interface DailyRankingItem {
  productSlug: string;
  rank: 1 | 2 | 3;
  score: number;
  reason: string;
}

export interface DailyPlatformBrief {
  date: string;
  slug: string;
  recommendations: PlatformRecommendation[];
  ranking: DailyRankingItem[];
  priorityPick: {
    productSlug: string;
    reason: string;
  };
  sourcesCheckedAt: string;
}

export const CHANNEL_PLATFORM = {
  "tiktok-mx": "TK",
  "temu-mx": "TM",
  "mercado-libre-mx": "MKD",
} as const;
