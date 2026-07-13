import { env } from "cloudflare:workers";
import { getRecommendation, listRecommendations, type D1DatabaseLike } from "./repository";
import { STATIC_REPORTS } from "./static-data";
import type { RecommendationReport } from "./types";

function runtimeDb(): D1DatabaseLike | null {
  try { return (env as unknown as { DB?: D1DatabaseLike }).DB ?? null; } catch { return null; }
}

export async function getAllReports(): Promise<RecommendationReport[]> {
  const db = runtimeDb();
  if (!db) return STATIC_REPORTS;
  try { const reports = await listRecommendations(db, {}); return reports.length ? reports : STATIC_REPORTS; } catch { return STATIC_REPORTS; }
}

export async function getReport(slug: string): Promise<RecommendationReport | null> {
  const db = runtimeDb();
  if (db) { try { const report = await getRecommendation(db, slug); if (report) return report; } catch { /* sample is available until migration */ } }
  return STATIC_REPORTS.find((report) => report.slug === slug) ?? null;
}
