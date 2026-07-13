import { describe, expect, it } from "vitest";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";
import { makeDailyBrief } from "./fixtures/daily-brief";

describe("daily three-platform brief validation", () => {
  it("accepts exactly three unique platform recommendations", () => {
    expect(validateDailyBrief(makeDailyBrief()).recommendations).toHaveLength(3);
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
