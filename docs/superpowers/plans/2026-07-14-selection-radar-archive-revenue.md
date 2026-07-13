# Selection Radar Archive and Revenue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the public product radar to “选品”, add combined date filtering, add auditable single-link monthly revenue estimates in USD, publish GitHub Pages, and send the latest published brief to the configured Feishu destination.

**Architecture:** Extend `RecommendationReport` with an optional monthly revenue evidence object and calculate USD ranges in a pure helper shared by React, static HTML, and Feishu rendering. Keep archive filtering pure in TypeScript and mirror the same predicate in the dependency-free GitHub Pages script. Treat GitHub Pages as the public source of truth; legacy reports without complete evidence render an explicit unavailable state.

**Tech Stack:** TypeScript 5.9, React 19, vinext/Next-compatible components, Vitest, Node test runner, static HTML renderer, GitHub Pages, Feishu incoming webhook.

## Global Constraints

- All displayed monthly revenue amounts use USD.
- Revenue requires auditable monthly units, unit price, and a same-day or latest-workday authoritative FX rate.
- Missing any required input renders “暂无可靠估算”; reviews, rankings, trends, and engagement cannot be converted into sales.
- GitHub Pages is the only hard publishing prerequisite for Feishu; Sites is best effort and must not block the message.
- User-facing “新品” becomes “选品”; repository names, directories, slugs, and historical URLs remain unchanged.
- Existing reports without `monthlyRevenueEstimate` must continue to validate and render.

---

### Task 1: Monthly revenue domain model and calculation

**Files:**
- Modify: `app/lib/recommendations/types.ts`
- Create: `app/lib/recommendations/monthly-revenue.ts`
- Modify: `app/lib/recommendations/validate.ts`
- Modify: `tests/fixtures/report.ts`
- Create: `tests/monthly-revenue.test.ts`
- Modify: `tests/validate-report.test.ts`

**Interfaces:**
- Produces: `MonthlyRevenueEstimate`, `MonthlyRevenueResult`, and `calculateMonthlyRevenueUsd(estimate?: MonthlyRevenueEstimate): MonthlyRevenueResult`.
- Produces: validation that accepts an absent estimate, rejects invalid available estimates, and accepts an explicit unavailable reason.

- [ ] **Step 1: Write failing calculation tests**

```ts
it("converts a bounded MXN monthly revenue estimate to USD", () => {
  expect(calculateMonthlyRevenueUsd({
    status: "available",
    sourceProductUrl: "https://example.test/product",
    period: "2026-06",
    estimatedMonthlyUnitsMin: 100,
    estimatedMonthlyUnitsMax: 120,
    unitPrice: 200,
    unitPriceCurrency: "MXN",
    mxnPerUsd: 20,
    fxCapturedAt: "2026-07-13",
    fxSourceUrl: "https://www.banxico.org.mx/example",
    fxPublisher: "Banco de México",
    method: "平台近30天销量区间 × 商品单价",
    confidence: "high",
    sourceUrls: ["https://example.test/product"],
    unavailableReason: null,
  })).toMatchObject({ status: "available", revenueUsdMin: 1000, revenueUsdMax: 1200 });
});

it("returns unavailable when the estimate is absent", () => {
  expect(calculateMonthlyRevenueUsd()).toEqual({
    status: "unavailable",
    reason: "暂无可靠估算",
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm vitest run tests/monthly-revenue.test.ts --config vitest.config.ts`

Expected: FAIL because `monthly-revenue.ts` and its exported function do not exist.

- [ ] **Step 3: Add the model and minimal pure calculation**

```ts
export function calculateMonthlyRevenueUsd(estimate?: MonthlyRevenueEstimate): MonthlyRevenueResult {
  if (!estimate || estimate.status === "unavailable") {
    return { status: "unavailable", reason: estimate?.unavailableReason ?? "暂无可靠估算" };
  }
  const factor = estimate.unitPriceCurrency === "USD" ? 1 : 1 / estimate.mxnPerUsd!;
  return {
    status: "available",
    revenueUsdMin: estimate.estimatedMonthlyUnitsMin! * estimate.unitPrice! * factor,
    revenueUsdMax: estimate.estimatedMonthlyUnitsMax! * estimate.unitPrice! * factor,
  };
}
```

Add the exact optional `monthlyRevenueEstimate?: MonthlyRevenueEstimate` property to `RecommendationReport`. Keep raw results unrounded; renderers format them.

- [ ] **Step 4: Run the calculation tests and verify GREEN**

Run: `pnpm vitest run tests/monthly-revenue.test.ts --config vitest.config.ts`

Expected: all tests in the file PASS.

- [ ] **Step 5: Write failing validation tests**

Add cases that reject negative units, min greater than max, zero FX, non-HTTPS source URLs, and an `available` estimate missing required fields. Add one case proving reports with no estimate still validate.

- [ ] **Step 6: Run validation tests and verify RED**

Run: `pnpm vitest run tests/validate-report.test.ts --config vitest.config.ts`

Expected: new invalid estimate cases FAIL because validation does not inspect the field.

- [ ] **Step 7: Implement estimate validation**

Validate finite non-negative units and price, ordered bounds, positive FX for MXN, `YYYY-MM` period, `YYYY-MM-DD` FX date, HTTPS URLs, valid confidence, and a non-empty unavailable reason when status is `unavailable`.

- [ ] **Step 8: Run focused tests and commit**

Run: `pnpm vitest run tests/monthly-revenue.test.ts tests/validate-report.test.ts --config vitest.config.ts`

Expected: PASS with zero failures.

Commit: `git commit -m "feat: add auditable monthly revenue estimates"`

---

### Task 2: Revenue presentation in React, static pages, and Feishu

**Files:**
- Create: `app/components/monthly-revenue-card.tsx`
- Modify: `app/components/platform-recommendation-card.tsx`
- Modify: `app/lib/static-site/render.ts`
- Modify: `app/lib/feishu.ts`
- Modify: `app/globals.css`
- Create: `tests/monthly-revenue-ui.test.tsx`
- Modify: `tests/static-site-render.test.ts`
- Modify: `tests/daily-feishu.test.ts`

**Interfaces:**
- Consumes: `calculateMonthlyRevenueUsd()` from Task 1.
- Produces: `MonthlyRevenueCard({ report }: { report: RecommendationReport })` and equivalent static/Feishu wording.

- [ ] **Step 1: Write failing UI and payload tests**

Assert that an available fixture renders `US$1,000–US$1,200 / 月`, period, confidence, method, FX publisher, and source product link. Assert that a legacy report renders `暂无可靠估算`. Assert that the daily Feishu card contains `单链接月销售额预估` for every recommendation.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm vitest run tests/monthly-revenue-ui.test.tsx tests/static-site-render.test.ts tests/daily-feishu.test.ts --config vitest.config.ts`

Expected: FAIL because revenue presentation does not exist.

- [ ] **Step 3: Implement shared formatting and presentation**

Use `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`. Render a compact evidence card in React and equivalent semantic HTML in the static renderer. Add the range or unavailable reason to each Feishu recommendation block without exposing internal configuration.

- [ ] **Step 4: Add responsive styles**

Add `.monthly-revenue-card`, `.monthly-revenue-grid`, and unavailable-state rules that reuse existing panel colors and collapse to one column on narrow screens.

- [ ] **Step 5: Run focused tests and commit**

Run: `pnpm vitest run tests/monthly-revenue-ui.test.tsx tests/static-site-render.test.ts tests/daily-feishu.test.ts --config vitest.config.ts`

Expected: PASS with zero failures.

Commit: `git commit -m "feat: show monthly revenue evidence"`

---

### Task 3: Combined archive date filtering

**Files:**
- Modify: `app/lib/recommendations/filter.ts`
- Modify: `app/components/archive-filters.tsx`
- Modify: `app/lib/static-site/render.ts`
- Modify: `public/github-pages.js`
- Modify: `app/globals.css`
- Modify: `tests/archive-filter.test.ts`
- Modify: `tests/static-daily-brief-render.test.ts`
- Modify: `tests/build-github-pages.test.ts`

**Interfaces:**
- Produces: `ArchiveFilters.date?: string` and date-aware filtering in both React and static pages.

- [ ] **Step 1: Write failing filter tests**

```ts
it("filters by exact report date and combines with other filters", () => {
  const older = makeReport({ date: "2026-07-12", slug: "older-report", verdict: "watch" });
  expect(filterRecommendations([makeReport(), older], { date: "2026-07-13" })).toHaveLength(1);
  expect(filterRecommendations([makeReport(), older], { date: "2026-07-12", verdict: "recommend" })).toHaveLength(0);
});
```

Add static assertions for `id="archive-date"`, descending date options, and `data-date="2026-07-13"`.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm vitest run tests/archive-filter.test.ts tests/static-daily-brief-render.test.ts tests/build-github-pages.test.ts --config vitest.config.ts`

Expected: FAIL because date is ignored and static markup lacks date hooks.

- [ ] **Step 3: Implement React date filtering**

Create a memoized, unique descending date list from `items`, add `date` state and the “全部日期” select, then pass `{ q, platform, verdict, date }` to `filterRecommendations`.

- [ ] **Step 4: Implement static date filtering**

Render the date select and `data-date` attributes. In `public/github-pages.js`, require the date select, include it in the predicate, and attach its `change` handler.

- [ ] **Step 5: Update the four-control layout and run tests**

Run: `pnpm vitest run tests/archive-filter.test.ts tests/static-daily-brief-render.test.ts tests/build-github-pages.test.ts --config vitest.config.ts`

Expected: PASS with zero failures.

Commit: `git commit -m "feat: filter archive by report date"`

---

### Task 4: Rename public copy from 新品 to 选品

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/components/site-header.tsx`
- Modify: `app/briefs/[slug]/page.tsx`
- Modify: `app/archive/page.tsx`
- Modify: `app/trends/page.tsx`
- Modify: `app/lib/static-site/render.ts`
- Modify: `app/lib/feishu.ts`
- Modify: `scripts/build-github-pages.ts`
- Modify: `tests/rendered-html.test.mjs`
- Modify: relevant static and Feishu tests

**Interfaces:**
- Produces: consistent “墨西哥选品雷达” and “墨西哥三平台选品简报” user-facing copy without changing technical paths.

- [ ] **Step 1: Change tests to require the approved names**

Replace existing `墨西哥新品雷达` assertions with `墨西哥选品雷达`, add a repository-wide rendered output assertion that public HTML and Feishu payloads contain no `新品雷达` or `新品简报`.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm vitest run tests/daily-feishu.test.ts tests/static-daily-brief-render.test.ts --config vitest.config.ts && node --test tests/rendered-html.test.mjs`

Expected: FAIL on old public copy.

- [ ] **Step 3: Replace user-facing copy only**

Update metadata, headers, daily brief page titles, 404 title, static shell, and Feishu headers. Do not rename repository or route identifiers.

- [ ] **Step 4: Run focused tests and commit**

Run: `pnpm vitest run tests/daily-feishu.test.ts tests/static-daily-brief-render.test.ts --config vitest.config.ts && node --test tests/rendered-html.test.mjs`

Expected: PASS with zero failures.

Commit: `git commit -m "refactor: rename product radar copy"`

---

### Task 5: Publication safety and latest brief preparation

**Files:**
- Modify: `.env.automation` only if `PUBLIC_SITE_ORIGIN` is not the GitHub Pages origin; never print secrets.
- Modify: `tests/publication-safety.test.ts`
- Modify: automation `automation-2` through the automation update tool, not by direct file editing.

**Interfaces:**
- Produces: Feishu URLs rooted at `https://grappen0728.github.io/mexico-product-radar`.
- Produces: automation name “墨西哥三平台带电带芯片选品日报” and GitHub-first publishing policy.

- [ ] **Step 1: Add or update publication safety assertions**

Assert that the public origin is normalized without duplicate slashes and that daily Feishu routing targets `/briefs/<slug>/` on the GitHub Pages origin.

- [ ] **Step 2: Run tests and verify RED if configuration behavior is missing**

Run: `pnpm vitest run tests/publication-safety.test.ts tests/daily-report-routing.test.ts tests/send-feishu-cli.test.ts --config vitest.config.ts`

Expected: any new missing routing behavior fails for the intended reason; otherwise configuration-only assertions remain green.

- [ ] **Step 3: Update safe public configuration and automation**

Set only `PUBLIC_SITE_ORIGIN` to the GitHub Pages origin while preserving webhook and signing-secret values. Update `automation-2` so GitHub Pages success is required, Sites failure is a warning, and the task/user-facing names say “选品”.

- [ ] **Step 4: Run focused tests and commit code changes**

Run: `pnpm vitest run tests/publication-safety.test.ts tests/daily-report-routing.test.ts tests/send-feishu-cli.test.ts --config vitest.config.ts`

Expected: PASS with zero failures.

Commit tracked changes, if any: `git commit -m "chore: make GitHub Pages the brief origin"`

---

### Task 6: Full verification, publish, and Feishu delivery

**Files:**
- Generated: `dist/**` via `pnpm pages:build` (not committed unless already tracked by project convention)
- No source edits during verification; failures return to the relevant TDD task.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: pushed GitHub commit, refreshed GitHub Pages site, and one Feishu message for the latest published daily brief.

- [ ] **Step 1: Run the complete local verification suite**

Run: `pnpm test`

Expected: Vitest reports zero failed tests, the vinext production build exits 0, and Node rendered-HTML tests pass.

Run: `pnpm lint`

Expected: ESLint exits 0 with no errors.

Run: `pnpm pages:build`

Expected: static Pages output completes and includes homepage, archive, recommendation, and brief pages.

- [ ] **Step 2: Inspect generated content**

Search generated HTML for `墨西哥选品雷达`, `archive-date`, `单链接月销售额预估`, and the latest brief slug. Verify no generated user-facing page contains `新品雷达` or `新品简报`.

- [ ] **Step 3: Commit and push the implementation branch**

Run `git status --short`, inspect the diff, commit only intended source/test changes, then push the integrated commit to the repository branch used by GitHub Pages.

- [ ] **Step 4: Verify the live GitHub Pages URLs**

Confirm HTTP 200 and the updated title on:

- `https://grappen0728.github.io/mexico-product-radar/`
- `https://grappen0728.github.io/mexico-product-radar/archive/`
- the latest `/briefs/<slug>/` URL.

- [ ] **Step 5: Send the latest published brief to Feishu**

Run: `pnpm send:daily-feishu -- data/daily-briefs/<latest-date>.json`

Expected: command prints `飞书三平台日报推送成功`; do not send until the live latest URL returns HTTP 200.

- [ ] **Step 6: Record final evidence**

Report the live brief URL, commit hash, total passing tests, lint/build results, and Feishu send result. If any step fails, report the actual failure and do not claim completion.
