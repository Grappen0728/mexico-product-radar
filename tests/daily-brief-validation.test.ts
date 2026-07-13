import { describe, expect, it } from "vitest";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";
import { makeDailyBrief } from "./fixtures/daily-brief";

describe("daily three-platform brief validation", () => {
  it("accepts exactly three unique platform recommendations", () => {
    const result = validateDailyBrief(makeDailyBrief());
    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[1].channel).toBe("temu-mx");
    expect(result.recommendations[1].report.platforms).toEqual(["TM"]);
  });

  it("rejects Amazon as the second channel in new daily briefs", () => {
    const brief = makeDailyBrief() as unknown as { recommendations: Array<{ channel: string; report: { platforms: string[] } }> };
    brief.recommendations[1].channel = "amazon-mx";
    brief.recommendations[1].report.platforms = ["AMZ"];
    expect(() => validateDailyBrief(brief)).toThrow("平台顺序必须为TikTok、Temu、Mercado Libre");
  });

  it("rejects duplicate products across platforms", () => {
    const brief = makeDailyBrief();
    brief.recommendations[1].report.slug = brief.recommendations[0].report.slug;
    expect(() => validateDailyBrief(brief)).toThrow("产品不能重复");
  });

  it("rejects competition opportunity scores outside one to five", () => {
    const brief = makeDailyBrief();
    brief.recommendations[2].scores.competitionOpportunity = 0;
    expect(() => validateDailyBrief(brief)).toThrow("竞争机会评分");
  });
});
