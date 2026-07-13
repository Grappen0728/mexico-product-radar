import { expect, it } from "vitest";
import { buildDailyBriefFeishuCard } from "../app/lib/feishu";
import { makeDailyBrief } from "./fixtures/daily-brief";

it("summarizes three products and links the complete daily brief", () => {
  const brief = makeDailyBrief();
  const card = buildDailyBriefFeishuCard(brief, "https://example.com/briefs/2026-07-14/");
  const text = JSON.stringify(card);
  for (const item of brief.recommendations) expect(text).toContain(item.report.product.zh);
  expect(text).toContain("TOP 1");
  expect(text).toContain("Temu Mexico");
  expect(text).not.toContain("Amazon Mexico");
  expect(text).toContain("查看完整三平台日报");
  expect(text).toContain("https://example.com/briefs/2026-07-14/");
});
