import brief0 from "../../../data/daily-briefs/2026-07-14.json";
import brief1 from "../../../data/daily-briefs/2026-07-13.json";
import type { DailyPlatformBrief } from "./types";
import { validateDailyBrief } from "./validate";

export const STATIC_DAILY_BRIEFS: DailyPlatformBrief[] = [brief0, brief1]
  .map(validateDailyBrief)
  .sort((left, right) => right.date.localeCompare(left.date));
