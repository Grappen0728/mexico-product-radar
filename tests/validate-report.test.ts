import { describe, expect, it } from "vitest";
import { validateReport } from "../app/lib/recommendations/validate";
import { makeReport } from "./fixtures/report";

describe("validateReport", () => {
  it("accepts a complete report", () => {
    expect(validateReport(makeReport()).slug).toBe("mini-thermal-printer");
  });

  it("rejects a source without a capture date", () => {
    const report = makeReport({
      sources: [{ title: "来源", url: "https://example.com", capturedAt: "" }],
    });
    expect(() => validateReport(report)).toThrow(/来源.*日期/);
  });

  it("rejects non-https media URLs", () => {
    const report = makeReport({
      media: [{ type: "image", title: "危险链接", url: "javascript:alert(1)" }],
    });
    expect(() => validateReport(report)).toThrow(/HTTPS/);
  });

  it("requires at least two trend signals", () => {
    const report = makeReport({
      trend: { ...makeReport().trend, evidence: [makeReport().trend.evidence[0]] },
    });
    expect(() => validateReport(report)).toThrow(/两条趋势证据/);
  });
});
