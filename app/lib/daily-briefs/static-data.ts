import type { DailyPlatformBrief } from "./types";
import { validateDailyBrief } from "./validate";

export const STATIC_DAILY_BRIEFS: DailyPlatformBrief[] = []
  .map(validateDailyBrief)
  .sort((left, right) => right.date.localeCompare(left.date));
