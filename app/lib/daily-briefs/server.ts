import { STATIC_DAILY_BRIEFS } from "./static-data";
import type { DailyPlatformBrief } from "./types";

export async function getAllDailyBriefs(): Promise<DailyPlatformBrief[]> {
  return STATIC_DAILY_BRIEFS;
}

export async function getLatestDailyBrief(): Promise<DailyPlatformBrief | null> {
  return STATIC_DAILY_BRIEFS[0] ?? null;
}

export async function getDailyBrief(dateOrSlug: string): Promise<DailyPlatformBrief | null> {
  return STATIC_DAILY_BRIEFS.find((brief) => brief.date === dateOrSlug || brief.slug === dateOrSlug) ?? null;
}
