import { env } from "cloudflare:workers";
import { getRecommendation, listRecommendations, type D1DatabaseLike } from "./repository";
import { STATIC_REPORTS } from "./static-data";
import type { RecommendationReport } from "./types";
import { STATIC_DAILY_BRIEFS } from "../daily-briefs/static-data";
import { mergeStaticReports } from "./all-static";

function allStaticReports(): RecommendationReport[] {
  return mergeStaticReports(STATIC_REPORTS, STATIC_DAILY_BRIEFS);
}

function runtimeDb(): D1DatabaseLike | null {
  try { return (env as unknown as { DB?: D1DatabaseLike }).DB ?? null; } catch { return null; }
}

export async function getAllReports(): Promise<RecommendationReport[]> {
  const db = runtimeDb();
  const staticReports = allStaticReports();
  if (!db) return staticReports;
  try { const reports = await listRecommendations(db, {}); return reports.length ? reports : staticReports; } catch { return staticReports; }
}

export async function getReport(slug: string): Promise<RecommendationReport | null> {
  const db = runtimeDb();
  if (db) { try { const report = await getRecommendation(db, slug); if (report) return report; } catch { /* sample is available until migration */ } }
  return allStaticReports().find((report) => report.slug === slug) ?? null;
}
