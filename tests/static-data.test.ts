import { describe, expect, it } from "vitest";
import { STATIC_REPORTS } from "../app/lib/recommendations/static-data";

describe("static recommendation archive", () => {
  it("contains dated reports sorted newest first", () => {
    expect(STATIC_REPORTS.length).toBeGreaterThan(0);
    expect(STATIC_REPORTS[0].date).toBe("2026-07-13");
    expect(STATIC_REPORTS[0].slug).toBe("mini-thermal-printer-2026-07-13");
    expect(STATIC_REPORTS.map((report) => report.date)).toEqual(
      [...STATIC_REPORTS].map((report) => report.date).sort().reverse(),
    );
  });
});
