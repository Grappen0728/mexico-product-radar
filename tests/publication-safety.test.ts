import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";

describe("public repository safety", () => {
  it("keeps private automation configuration and generated output out of Git", async () => {
    const ignore = await readFile(".gitignore", "utf8");
    expect(ignore).toContain(".env.automation");
    expect(ignore).toContain("dist-pages/");
  });

  it("publishes today's second recommendation as a sourced electric Temu product", async () => {
    const raw = JSON.parse(await readFile("data/daily-briefs/2026-07-13.json", "utf8"));
    const brief = validateDailyBrief(raw);
    const temu = brief.recommendations[1];
    expect(temu.channel).toBe("temu-mx");
    expect(temu.report.platforms).toEqual(["TM"]);
    expect(temu.report.sources.length).toBeGreaterThanOrEqual(2);
    expect(temu.report.electronics.battery.trim()).not.toBe("");
    expect(temu.report.electronics.chip.trim()).not.toBe("");
    expect(JSON.stringify(temu)).not.toMatch(/Amazon|amazon-mx|AMZ/);
  });
});
