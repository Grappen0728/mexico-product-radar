import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("preserves the legacy hero and adds the three platform section", async () => {
  const home = await readFile("app/page.tsx", "utf8");
  const component = await readFile("app/components/three-platform-brief.tsx", "utf8");
  const card = await readFile("app/components/platform-recommendation-card.tsx", "utf8");
  expect(home).toContain("<DailyBrief"); expect(home).toContain("<ThreePlatformBrief"); expect(component).toContain("今日三平台推荐");
  expect(card).toContain("TikTok Shop Mexico"); expect(card).toContain("Temu Mexico"); expect(card).toContain("Mercado Libre Mexico");
  expect(card).not.toContain("Amazon Mexico");
});
