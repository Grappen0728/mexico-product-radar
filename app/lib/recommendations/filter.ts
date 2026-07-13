import type { RecommendationReport } from "./types";

export interface ArchiveFilters { q?: string; platform?: string; verdict?: string; trend?: string; date?: string }

export function filterRecommendations(items: RecommendationReport[], filters: ArchiveFilters): RecommendationReport[] {
  const q = filters.q?.trim().toLocaleLowerCase();
  return items.filter((report) => {
    const searchable = [report.product.zh, report.product.es, ...report.product.keywords, report.category].join(" ").toLocaleLowerCase();
    return (!q || searchable.includes(q))
      && (!filters.platform || report.platforms.includes(filters.platform as never))
      && (!filters.verdict || report.verdict === filters.verdict)
      && (!filters.trend || report.trend.status === filters.trend)
      && (!filters.date || report.date === filters.date);
  });
}
