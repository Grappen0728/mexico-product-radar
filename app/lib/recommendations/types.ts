export const PLATFORMS = ["TK", "AMZ", "MKD", "TM"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type Verdict = "recommend" | "watch" | "reject";
export type TrendStatus = "hot" | "rising" | "stable";
export type MediaType = "image" | "video";

export function isPlatform(value: string): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export interface SourceLink {
  title: string;
  url: string;
  capturedAt: string;
  note?: string;
}

export interface TrendEvidence extends SourceLink {
  signal: string;
}

export interface MediaLink {
  type: MediaType;
  title: string;
  url: string;
  thumbnailUrl?: string;
  note?: string;
}

export interface RecommendationReport {
  date: string;
  slug: string;
  product: {
    zh: string;
    es: string;
    keywords: string[];
  };
  category: string;
  scenarios: string[];
  audience: string[];
  platforms: Platform[];
  metrics: {
    price: number | null;
    currency: string;
    sold: number | null;
    rating: number | null;
    reviews: number | null;
    discount: number | null;
  };
  trend: {
    status: TrendStatus;
    label: string;
    evidence: TrendEvidence[];
  };
  reasons: string[];
  supplyChain: {
    purchaseUsdMin: number | null;
    purchaseUsdMax: number | null;
    retailMxnMin: number | null;
    retailMxnMax: number | null;
    logistics?: string;
  };
  electronics: {
    battery: string;
    charging: string;
    chip: string;
  };
  risks: string[];
  nextAction: string;
  verdict: Verdict;
  media: MediaLink[];
  sources: SourceLink[];
}

export interface RecommendationListItem {
  date: string;
  slug: string;
  productZh: string;
  productEs: string;
  keywords: string[];
  category: string;
  platforms: Platform[];
  price: number | null;
  currency: string;
  trendStatus: TrendStatus;
  verdict: Verdict;
}
