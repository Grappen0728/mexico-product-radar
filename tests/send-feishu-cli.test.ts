import { describe, expect, it } from "vitest";
import { parseEnvFile, resolveReportArg } from "../scripts/send-feishu";

describe("Feishu sender configuration", () => {
  it("parses private environment files without truncating URLs", () => {
    expect(parseEnvFile("# private\nFEISHU_WEBHOOK_URL=https://example.test/hook?a=b\nPUBLIC_SITE_ORIGIN=https://site.test\n")).toEqual({
      FEISHU_WEBHOOK_URL: "https://example.test/hook?a=b",
      PUBLIC_SITE_ORIGIN: "https://site.test",
    });
  });

  it("ignores pnpm's argument separator", () => {
    expect(resolveReportArg(["--", "data/recommendations/report.json"])).toBe("data/recommendations/report.json");
  });
});
