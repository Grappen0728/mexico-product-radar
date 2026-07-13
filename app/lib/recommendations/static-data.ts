import { SAMPLE_REPORT } from "./sample";
import type { RecommendationReport } from "./types";

export const STATIC_REPORTS: RecommendationReport[] = [SAMPLE_REPORT]
  .sort((left, right) => right.date.localeCompare(left.date));
