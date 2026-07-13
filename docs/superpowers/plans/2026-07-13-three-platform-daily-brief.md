# Three-Platform Daily Brief Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Mexico Product Radar layout with one unique chip-enabled electric product for TikTok Shop Mexico, Amazon Mexico, and Mercado Libre Mexico each day, plus a unified ranking and Feishu summary.

**Architecture:** Preserve the existing `RecommendationReport` and legacy pages, then add a new `DailyPlatformBrief` aggregate containing three platform-specific recommendations. React pages and the GitHub Pages static renderer consume the same validated aggregate; publishing verifies the daily page before the Feishu sender can run.

**Tech Stack:** TypeScript, React 19, Vinext, Vitest, static HTML/CSS, GitHub Pages, GitHub Actions, Feishu custom bot.

## Global Constraints

- Every normal daily brief contains exactly three different products.
- Every product must be electric or battery-powered and must identify its chip or chip-driven function.
- Platform order is TikTok Shop Mexico, Amazon Mexico, Mercado Libre Mexico.
- Competition score is an opportunity score: 5 stars means lower competition or stronger differentiation.
- Preserve the current dark dashboard, hero card, navigation, archive, trends, and legacy product pages.
- Never fabricate unavailable sales, GMV, search volume, growth, commission, or ROI data.
- Publish and verify GitHub Pages before sending Feishu.
- Never commit or print webhook, signing secret, GitHub credential, or environment files.

---

### Task 1: Daily brief types and validation

**Files:**
- Modify: `app/lib/recommendations/types.ts`
- Modify: `app/components/archive-filters.tsx`
- Create: `app/lib/daily-briefs/types.ts`
- Create: `app/lib/daily-briefs/validate.ts`
- Test: `tests/daily-brief-validation.test.ts`
- Create: `tests/fixtures/daily-brief.ts`

**Interfaces:**
- Produces: `DailyChannel`, `OpportunityScores`, `PlatformRecommendation`, `DailyRankingItem`, `DailyPlatformBrief`, and `validateDailyBrief(value: unknown): DailyPlatformBrief`.
- Consumes: `RecommendationReport` from `app/lib/recommendations/types.ts`.

Extend the legacy platform enum with `AMZ` and its user-facing label while preserving `TK`, `MKD`, and `TM`. Daily channels map to `TK`, `AMZ`, and `MKD`; Temu remains available for historical reports and archive filters but is not one of the three daily channels.

- [ ] **Step 1: Write the failing validation tests**

```ts
import { describe, expect, it } from "vitest";
import { makeDailyBrief } from "./fixtures/daily-brief";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";

describe("daily three-platform brief validation", () => {
  it("accepts exactly three unique platform recommendations", () => {
    expect(validateDailyBrief(makeDailyBrief()).recommendations).toHaveLength(3);
  });

  it("rejects duplicate products across platforms", () => {
    const brief = makeDailyBrief();
    brief.recommendations[1].report.slug = brief.recommendations[0].report.slug;
    expect(() => validateDailyBrief(brief)).toThrow("产品不能重复");
  });

  it("rejects competition opportunity scores outside one to five", () => {
    const brief = makeDailyBrief();
    brief.recommendations[2].scores.competitionOpportunity = 0;
    expect(() => validateDailyBrief(brief)).toThrow("竞争机会评分");
  });
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `pnpm exec vitest run tests/daily-brief-validation.test.ts --config vitest.config.ts`

Expected: FAIL because the daily brief modules do not exist.

- [ ] **Step 3: Implement the discriminated model**

```ts
export const DAILY_CHANNELS = ["tiktok-mx", "amazon-mx", "mercado-libre-mx"] as const;
export type DailyChannel = typeof DAILY_CHANNELS[number];

export interface OpportunityScores {
  demand: number;
  competitionOpportunity: number;
  profit: number;
  platformFit: number;
  contentOrSalesPotential: number;
  riskControl: number;
}

export interface PlatformRecommendation {
  channel: DailyChannel;
  report: RecommendationReport;
  whyRecommended: string;
  analysis: string[];
  scores: OpportunityScores;
  platformPlaybook: string[];
  commercialModel: {
    purchaseCost: string;
    suggestedPrice: string;
    estimatedProfit: string;
    suitableCommission?: string;
    targetRoi?: string;
  };
  testAdvice: string;
}

export interface DailyRankingItem { productSlug: string; rank: 1 | 2 | 3; score: number; reason: string }

export interface DailyPlatformBrief {
  date: string;
  slug: string;
  recommendations: PlatformRecommendation[];
  ranking: DailyRankingItem[];
  priorityPick: { productSlug: string; reason: string };
  sourcesCheckedAt: string;
}
```

`validateDailyBrief` must call `validateReport` for every nested report, require channels in the fixed order, require three unique product slugs, require all six scores to be integers from 1–5, require ranking values 1–3 with scores from 0–100, and require `priorityPick.productSlug` to equal rank 1.

- [ ] **Step 4: Run targeted and full unit tests**

Run: `pnpm exec vitest run tests/daily-brief-validation.test.ts --config vitest.config.ts`

Expected: 3 tests pass.

Run: `pnpm test:unit`

Expected: all legacy and new unit tests pass.

- [ ] **Step 5: Commit**

```powershell
git add app/lib/recommendations/types.ts app/components/archive-filters.tsx app/lib/daily-briefs tests/daily-brief-validation.test.ts tests/fixtures/daily-brief.ts
git commit -m "feat: validate three-platform daily briefs"
```

### Task 2: Daily JSON history and synchronization

**Files:**
- Create: `data/daily-briefs/README.md`
- Create: `app/lib/daily-briefs/static-data.ts`
- Create: `app/lib/daily-briefs/server.ts`
- Create: `scripts/sync-daily-briefs.ts`
- Modify: `package.json`
- Test: `tests/sync-daily-briefs.test.ts`

**Interfaces:**
- Produces: `STATIC_DAILY_BRIEFS`, `getAllDailyBriefs()`, `getLatestDailyBrief()`, `getDailyBrief(dateOrSlug)`, and `generateDailyBriefModule(files: string[]): string`.

- [ ] **Step 1: Write the failing synchronization test**

```ts
import { expect, it } from "vitest";
import { generateDailyBriefModule } from "../scripts/sync-daily-briefs";

it("sorts daily brief JSON newest first", () => {
  const output = generateDailyBriefModule(["2026-07-14.json", "2026-07-13.json"]);
  expect(output.indexOf("2026-07-14.json")).toBeLessThan(output.indexOf("2026-07-13.json"));
  expect(output).toContain("validateDailyBrief");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/sync-daily-briefs.test.ts --config vitest.config.ts`

Expected: FAIL because the synchronization script is missing.

- [ ] **Step 3: Implement history synchronization**

The script reads only `.json` files from `data/daily-briefs`, validates each file, and generates imports in `app/lib/daily-briefs/static-data.ts`. The generated export is:

```ts
export const STATIC_DAILY_BRIEFS: DailyPlatformBrief[] = [report0, report1]
  .map(validateDailyBrief)
  .sort((left, right) => right.date.localeCompare(left.date));
```

Add package scripts:

```json
{
  "brief:sync": "tsx scripts/sync-daily-briefs.ts",
  "send:daily-feishu": "tsx scripts/send-daily-feishu.ts"
}
```

- [ ] **Step 4: Verify synchronization**

Run: `pnpm exec vitest run tests/sync-daily-briefs.test.ts --config vitest.config.ts`

Expected: PASS.

Run: `pnpm exec tsx scripts/sync-daily-briefs.ts`

Expected: zero real daily briefs initially and a valid empty generated module.

- [ ] **Step 5: Commit**

```powershell
git add data/daily-briefs app/lib/daily-briefs scripts/sync-daily-briefs.ts package.json tests/sync-daily-briefs.test.ts
git commit -m "feat: store three-platform brief history"
```

### Task 3: Preserve the homepage and add three-platform React UI

**Files:**
- Create: `app/components/platform-recommendation-card.tsx`
- Create: `app/components/daily-ranking.tsx`
- Create: `app/components/three-platform-brief.tsx`
- Create: `app/briefs/[slug]/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/three-platform-ui.test.ts`

**Interfaces:**
- Consumes: `DailyPlatformBrief`, `getLatestDailyBrief`, and the existing `DailyBrief` hero.
- Produces: `ThreePlatformBrief({ brief, compact? })`, `PlatformRecommendationCard({ recommendation })`, and `DailyRanking({ brief })`.

- [ ] **Step 1: Write the failing structural UI test**

```ts
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("preserves the legacy hero and adds the three platform section", async () => {
  const home = await readFile("app/page.tsx", "utf8");
  const component = await readFile("app/components/three-platform-brief.tsx", "utf8");
  expect(home).toContain("<DailyBrief");
  expect(home).toContain("<ThreePlatformBrief");
  expect(component).toContain("今日三平台推荐");
  expect(component).toContain("TikTok Shop Mexico");
  expect(component).toContain("Amazon Mexico");
  expect(component).toContain("Mercado Libre Mexico");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/three-platform-ui.test.ts --config vitest.config.ts`

Expected: FAIL because the new component is missing.

- [ ] **Step 3: Implement UI without replacing legacy components**

`app/page.tsx` must select the rank-1 nested report as the `DailyBrief` hero when a new daily brief exists; otherwise it keeps the current latest legacy report. Directly below the hero, render `ThreePlatformBrief`. Keep the existing archive section unchanged.

Each platform card displays platform name, product, price, five visible opportunity ratings, platform playbook, commercial model, and test advice. The detail route renders all analysis fields, sources, media, ranking, and priority choice.

Append CSS using existing variables only, including `.platform-brief-grid`, `.platform-card`, `.star-score`, `.commercial-grid`, and `.ranking-panel`. Desktop uses three columns; mobile uses one column.

- [ ] **Step 4: Verify UI and type safety**

Run: `pnpm exec vitest run tests/three-platform-ui.test.ts --config vitest.config.ts`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Expected: every command succeeds and existing routes remain present.

- [ ] **Step 5: Commit**

```powershell
git add app/components app/briefs app/page.tsx app/globals.css tests/three-platform-ui.test.ts
git commit -m "feat: add three-platform dashboard content"
```

### Task 4: Extend GitHub Pages static rendering

**Files:**
- Modify: `app/lib/static-site/render.ts`
- Modify: `scripts/build-github-pages.ts`
- Modify: `public/github-pages.js`
- Test: `tests/static-daily-brief-render.test.ts`
- Modify: `tests/build-github-pages.test.ts`

**Interfaces:**
- Produces: `renderDailyBriefHome(brief, legacyReports, options)` and `renderDailyBriefPage(brief, options)`.
- Extends: `buildGitHubPages` to emit `briefs/<brief.slug>/index.html` and nested product pages.

- [ ] **Step 1: Write the failing static render test**

```ts
import { expect, it } from "vitest";
import { makeDailyBrief } from "./fixtures/daily-brief";
import { renderDailyBriefPage } from "../app/lib/static-site/render";

it("renders all three platforms and the unique priority pick", () => {
  const brief = makeDailyBrief();
  const html = renderDailyBriefPage(brief, { basePath: "/mexico-product-radar" });
  for (const item of brief.recommendations) expect(html).toContain(item.report.product.zh);
  expect(html).toContain("如果只能测试一个产品");
  expect(html).toContain("/mexico-product-radar/recommendations/");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/static-daily-brief-render.test.ts --config vitest.config.ts`

Expected: FAIL because `renderDailyBriefPage` is missing.

- [ ] **Step 3: Implement static HTML using existing classes**

The static homepage must keep the current hero markup, then add the same platform cards and ranking panel as React. When no daily brief exists, call the legacy `renderHome` unchanged. Generate one daily page and three product detail pages for every brief.

- [ ] **Step 4: Verify static output**

Run: `pnpm pages:test`

Run: `pnpm pages:build`

Expected: all static tests pass; the build lists the legacy pages plus daily brief and product paths when fixture JSON is present.

- [ ] **Step 5: Commit**

```powershell
git add app/lib/static-site/render.ts scripts/build-github-pages.ts public/github-pages.js tests
git commit -m "feat: publish three-platform static briefs"
```

### Task 5: Daily Feishu summary card

**Files:**
- Modify: `app/lib/feishu.ts`
- Create: `scripts/send-daily-feishu.ts`
- Test: `tests/daily-feishu.test.ts`

**Interfaces:**
- Produces: `buildDailyBriefFeishuCard(brief, publicUrl)` and `pushDailyBriefFeishuCard(options)`.
- Consumes: a validated `DailyPlatformBrief` and `.env.automation`.

- [ ] **Step 1: Write the failing card test**

```ts
import { expect, it } from "vitest";
import { makeDailyBrief } from "./fixtures/daily-brief";
import { buildDailyBriefFeishuCard } from "../app/lib/feishu";

it("summarizes three products and links the complete daily brief", () => {
  const brief = makeDailyBrief();
  const card = buildDailyBriefFeishuCard(brief, "https://example.com/briefs/2026-07-14/");
  const text = JSON.stringify(card);
  for (const item of brief.recommendations) expect(text).toContain(item.report.product.zh);
  expect(text).toContain("TOP 1");
  expect(text).toContain("查看完整三平台日报");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/daily-feishu.test.ts --config vitest.config.ts`

Expected: FAIL because the daily card builder is missing.

- [ ] **Step 3: Implement the card and guarded CLI**

The card has one header, three platform summary blocks, one TOP 1 block, one action button, and one public-information note. The CLI validates the JSON, verifies the slug exists in `STATIC_DAILY_BRIEFS`, and builds `${PUBLIC_SITE_ORIGIN}/briefs/${brief.slug}/`.

- [ ] **Step 4: Run Feishu and full tests**

Run: `pnpm exec vitest run tests/daily-feishu.test.ts tests/send-feishu-cli.test.ts --config vitest.config.ts`

Run: `pnpm test:unit`

Expected: all tests pass without sending a live card.

- [ ] **Step 5: Commit**

```powershell
git add app/lib/feishu.ts scripts/send-daily-feishu.ts tests/daily-feishu.test.ts
git commit -m "feat: send three-platform Feishu briefs"
```

### Task 6: Produce and publish the first real three-platform brief

**Files:**
- Create: `data/daily-briefs/2026-07-13.json`
- Regenerate: `app/lib/daily-briefs/static-data.ts`

**Interfaces:**
- Consumes: live public research for TikTok Shop Mexico, Amazon Mexico, Mercado Libre Mexico.
- Produces: the first validated `DailyPlatformBrief` with three unique electric, chip-enabled products.

- [ ] **Step 1: Research three unique qualified products**

Use live platform pages and at least one independent supporting source per product. Reuse the already verified mini Bluetooth thermal printer only for the platform where it has the strongest fit; research two different products for the other platforms.

- [ ] **Step 2: Write and validate the JSON**

Run: `pnpm brief:sync`

Expected: one daily brief synchronized with no validation errors.

- [ ] **Step 3: Run complete local verification**

Run: `pnpm test:unit`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Run: `pnpm pages:build`

Expected: all commands succeed and `dist-pages/briefs/2026-07-13/index.html` contains three unique product names.

- [ ] **Step 4: Commit and deploy**

```powershell
git add data/daily-briefs app/lib/daily-briefs/static-data.ts
git commit -m "content: publish first three-platform brief"
git push github master
```

Wait for `Deploy GitHub Pages` to succeed, then verify the daily page and all three product pages return HTTP 200 without a block page.

- [ ] **Step 5: Send the live Feishu summary**

Run: `pnpm send:daily-feishu -- data/daily-briefs/2026-07-13.json`

Expected: Feishu accepts one summary card whose button opens the verified daily page.

### Task 7: Update and verify the daily automation

**Files:**
- Modify: Codex automation `automation-2` through the automation API.

**Interfaces:**
- Consumes: the three-platform JSON schema and GitHub Pages workflow.
- Produces: a daily 10:07 job that creates three unique products and sends one Feishu card.

- [ ] **Step 1: Replace the one-product prompt**

Require exactly the user-approved TikTok, Amazon, and Mercado Libre sections, the six opportunity scores, three video hooks for TikTok, commercial models, ranking, and one priority pick. Keep the electric-plus-chip filter and 30-day duplicate exclusion.

- [ ] **Step 2: Enforce publication order**

The prompt must run `brief:sync`, tests, typecheck, both builds, secret scan, commit, GitHub push, Pages workflow wait, daily-page verification, and only then `send:daily-feishu`.

- [ ] **Step 3: Verify automation configuration**

Confirm the task is ACTIVE, scheduled at 10:07, targets the project root, uses the GitHub Pages origin, and references all three platforms.

- [ ] **Step 4: Final repository verification**

Run the complete test and build sequence once more on merged `master`, confirm Git is clean, push the merged commit, and verify the latest GitHub Pages workflow succeeds.
