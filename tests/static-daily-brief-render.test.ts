import { expect, it } from "vitest";
import { renderDailyBriefHome, renderDailyBriefPage } from "../app/lib/static-site/render";
import { SAMPLE_REPORT } from "../app/lib/recommendations/sample";
import { makeDailyBrief } from "./fixtures/daily-brief";

it("renders all three platforms and the unique priority pick", () => {
  const brief = makeDailyBrief();
  const html = renderDailyBriefPage(brief, { basePath: "/mexico-product-radar" });
  for (const item of brief.recommendations) expect(html).toContain(item.report.product.zh);
  expect(html).toContain("如果只能测试一个产品");
  expect(html).toContain("/mexico-product-radar/recommendations/");
});

it("keeps the legacy hero before the new three-platform section", () => {
  const html = renderDailyBriefHome(makeDailyBrief(), [SAMPLE_REPORT], { basePath: "/mexico-product-radar" });
  expect(html).toContain("daily-brief");
  expect(html).toContain("今日三平台推荐");
  expect(html.indexOf("daily-brief")).toBeLessThan(html.indexOf("今日三平台推荐"));
});
