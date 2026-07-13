import { expect, it } from "vitest";
import { mergeStaticReports } from "../app/lib/recommendations/all-static";
import { SAMPLE_REPORT } from "../app/lib/recommendations/sample";
import { makeDailyBrief } from "./fixtures/daily-brief";

it("merges nested daily products into legacy detail data", () => {
  const brief = makeDailyBrief();
  const reports = mergeStaticReports([SAMPLE_REPORT], [brief]);
  for (const recommendation of brief.recommendations) {
    expect(reports.some((report) => report.slug === recommendation.report.slug)).toBe(true);
  }
});
