import type { ClaimMetric, RecommendationReport, SourceLink } from "./types";

export type EvidenceConfidence = "high" | "medium" | "low";

export interface EvidenceQualityAssessment {
  confidence: EvidenceConfidence;
  coveragePercent: number;
  usableSourceCount: number;
  independentPublisherCount: number;
  localEvidenceCount: number;
  unsupportedExactMetrics: ClaimMetric[];
  issues: string[];
  rankingEligible: boolean;
  rankingScoreCap: number;
  lastCheckedAt: string | null;
}

const EXACT_METRICS = ["price", "sold", "rating", "reviews", "discount"] as const;

function uniqueSources(report: RecommendationReport): SourceLink[] {
  const byUrl = new Map<string, SourceLink>();
  for (const source of [...report.sources, ...report.trend.evidence]) {
    const existing = byUrl.get(source.url);
    if (!existing || (existing.supports?.length ?? 0) < (source.supports?.length ?? 0)) byUrl.set(source.url, source);
  }
  return [...byUrl.values()];
}

function isUsable(source: SourceLink): boolean {
  return source.accessState === "available";
}

function supportsExactMetric(source: SourceLink, metric: ClaimMetric): boolean {
  return isUsable(source)
    && (source.grade === "A" || source.grade === "B")
    && source.isEstimated !== true
    && source.supports?.includes(metric) === true;
}

export function assessEvidenceQuality(report: RecommendationReport): EvidenceQualityAssessment {
  const sources = uniqueSources(report);
  const usable = sources.filter(isUsable);
  const publishers = new Set(usable.map((source) => source.publisher?.trim()).filter((value): value is string => Boolean(value)));
  const localEvidenceCount = usable.filter((source) => source.geo?.toUpperCase() === "MX").length;

  const unsupportedExactMetrics = EXACT_METRICS.filter((metric) => {
    if (report.metrics[metric] === null) return false;
    return !usable.some((source) => supportsExactMetric(source, metric));
  });

  const requiredMetrics: ClaimMetric[] = ["demand", "trend", "specification"];
  for (const metric of EXACT_METRICS) if (report.metrics[metric] !== null) requiredMetrics.push(metric);
  const coveredMetrics = requiredMetrics.filter((metric) => usable.some((source) => {
    if (!source.supports?.includes(metric)) return false;
    return EXACT_METRICS.includes(metric as (typeof EXACT_METRICS)[number]) ? supportsExactMetric(source, metric) : true;
  }));
  const coveragePercent = Math.round((coveredMetrics.length / requiredMetrics.length) * 100);

  const issues: string[] = [];
  if (unsupportedExactMetrics.length > 0) issues.push(`精确指标缺少官方或授权来源：${unsupportedExactMetrics.join("、")}`);

  if (report.trend.status === "hot" || report.trend.status === "rising") {
    const trendSources = report.trend.evidence.filter((source) => isUsable(source) && (source.supports?.includes("demand") || source.supports?.includes("trend")));
    const trendPublishers = new Set(trendSources.map((source) => source.publisher?.trim()).filter((value): value is string => Boolean(value)));
    if (trendPublishers.size < 2) issues.push("趋势判断缺少两个独立发布方的可用需求证据");
    if (!trendSources.some((source) => source.geo?.toUpperCase() === "MX")) issues.push("趋势判断缺少墨西哥本地需求证据");
  }

  let confidence: EvidenceConfidence = "low";
  if (issues.length === 0 && coveragePercent >= 80) confidence = "high";
  else if (unsupportedExactMetrics.length === 0 && coveragePercent >= 60) confidence = "medium";

  const rankingScoreCap = confidence === "high" ? 100 : confidence === "medium" ? 89 : 79;
  const rankingEligible = confidence !== "low" && !issues.some((issue) => issue.startsWith("趋势判断"));
  const checkedTimes = usable.map((source) => source.checkedAt).filter((value): value is string => Boolean(value)).sort();

  return {
    confidence,
    coveragePercent,
    usableSourceCount: usable.length,
    independentPublisherCount: publishers.size,
    localEvidenceCount,
    unsupportedExactMetrics,
    issues,
    rankingEligible,
    rankingScoreCap,
    lastCheckedAt: checkedTimes.at(-1) ?? null,
  };
}
