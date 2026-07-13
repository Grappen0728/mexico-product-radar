import { describe, expect, it } from "vitest";
import { buildFeishuCard } from "../app/lib/feishu";
import { makeReport } from "./fixtures/report";

describe("Feishu card", () => {
  it("includes a public detail button and decision summary", () => {
    const card = buildFeishuCard(
      makeReport(),
      "https://example.com/recommendations/mini-thermal-printer",
    );
    const serialized = JSON.stringify(card);
    expect(serialized).toContain("查看完整报告");
    expect(serialized).toContain("mini-thermal-printer");
    expect(serialized).toContain("MXN 278.91");
    expect(serialized).toContain("推荐测试");
  });
});
