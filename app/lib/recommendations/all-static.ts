import type { DailyPlatformBrief } from "../daily-briefs/types";
import type { RecommendationReport } from "./types";

export function mergeStaticReports(
  legacyReports: RecommendationReport[],
  dailyBriefs: DailyPlatformBrief[],
): RecommendationReport[] {
  const dailyReports = dailyBriefs.flatMap((brief) => brief.recommendations.map((item) => item.report));
  return [...dailyReports, ...legacyReports]
    .filter((report, index, reports) => reports.findIndex((item) => item.slug === report.slug) === index)
    .sort((left, right) => right.date.localeCompare(left.date));
}
