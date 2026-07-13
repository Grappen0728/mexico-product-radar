import { expect, it } from "vitest";
import { generateDailyBriefModule } from "../scripts/sync-daily-briefs";

it("sorts daily brief JSON newest first", () => {
  const output = generateDailyBriefModule(["2026-07-13.json", "2026-07-14.json"]);
  expect(output.indexOf("2026-07-14.json")).toBeLessThan(output.indexOf("2026-07-13.json"));
  expect(output).toContain("validateDailyBrief");
});
