import { describe, expect, it } from "vitest";
import { renderStaticDataModule } from "../scripts/sync-recommendations";

describe("recommendation archive generator", () => {
  it("renders stable JSON imports for every dated report", () => {
    const output = renderStaticDataModule([
      "2026-07-12-smart-tag.json",
      "2026-07-13-mini-printer.json",
    ]);

    expect(output).toContain("import { SAMPLE_REPORT } from \"./sample\"");
    expect(output).toContain("report0 from \"../../../data/recommendations/2026-07-12-smart-tag.json\"");
    expect(output).toContain("report1 from \"../../../data/recommendations/2026-07-13-mini-printer.json\"");
    expect(output).toContain("right.date.localeCompare(left.date)");
  });
});
