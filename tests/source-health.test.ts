import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";
import { validateReport } from "../app/lib/recommendations/validate";
import { makeReport } from "./fixtures/report";

describe("source and media publication health", () => {
  it("rejects search or tag pages presented as direct available media", () => {
    const report = makeReport({
      media: [{
        type: "video",
        title: "generic search",
        url: "https://www.youtube.com/results?search_query=inflador",
        accessState: "available",
        direct: true,
        checkedAt: "2026-07-13T10:00:00+08:00",
        sourceTitle: "YouTube",
      }],
    });
    expect(() => validateReport(report)).toThrow("搜索或标签页不能作为直接媒体");
  });

  it("keeps today's generic media as excluded audit records and removes the invalid supplier link", async () => {
    const raw = JSON.parse(await readFile("data/daily-briefs/2026-07-13.json", "utf8"));
    const brief = validateDailyBrief(raw);
    const serialized = JSON.stringify(brief);
    expect(serialized).not.toContain("alibaba.com/showroom");
    for (const recommendation of brief.recommendations) {
      for (const media of recommendation.report.media) {
        if (/youtube\.com\/results|tiktok\.com\/tag\//.test(media.url)) {
          expect(media.accessState).toBe("invalid");
          expect(media.direct).toBe(false);
        }
      }
    }
  });

  it("does not publish precise marketplace metrics from the blocked Mercado Libre page", async () => {
    const raw = JSON.parse(await readFile("data/daily-briefs/2026-07-13.json", "utf8"));
    const brief = validateDailyBrief(raw);
    const mercado = brief.recommendations[2].report;
    expect(mercado.metrics).toEqual({ price: null, currency: "MXN", sold: null, rating: null, reviews: null, discount: null });
    expect(mercado.sources.find((source) => source.publisher === "Mercado Libre")?.accessState).toBe("blocked");
  });
});
