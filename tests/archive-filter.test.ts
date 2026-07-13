import { describe, expect, it } from "vitest";
import { filterRecommendations } from "../app/lib/recommendations/filter";
import { makeReport } from "./fixtures/report";

const items = [makeReport()];

describe("archive filters", () => {
  it("matches Chinese, Spanish, and English terms", () => {
    expect(filterRecommendations(items, { q: "impresora" })).toHaveLength(1);
    expect(filterRecommendations(items, { q: "打印机" })).toHaveLength(1);
    expect(filterRecommendations(items, { q: "thermal" })).toHaveLength(1);
  });

  it("filters by platform and verdict", () => {
    expect(filterRecommendations(items, { platform: "MKD", verdict: "recommend" })).toHaveLength(1);
    expect(filterRecommendations(items, { platform: "TK", verdict: "watch" })).toHaveLength(0);
  });

  it("filters by exact report date and combines with other filters", () => {
    const older = makeReport({ date: "2026-07-12", slug: "older-report", verdict: "watch" });
    expect(filterRecommendations([makeReport(), older], { date: "2026-07-13" })).toHaveLength(1);
    expect(filterRecommendations([makeReport(), older], { date: "2026-07-12", verdict: "recommend" })).toHaveLength(0);
  });
});
