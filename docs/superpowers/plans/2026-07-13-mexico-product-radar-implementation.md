# Mexico Product Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a public Mexico product-intelligence site that stores one structured recommendation per day and pushes a linked summary card to a Feishu group.

**Architecture:** A Vinext/React Sites application renders public dashboard, archive, trend, and detail routes. Cloudflare D1 stores structured recommendation records; a token-protected ingestion route validates and upserts reports, then calls a Feishu custom-robot webhook without exposing secrets to public clients.

**Tech Stack:** TypeScript, React, Vinext, Cloudflare Workers, D1, Vitest, Sites hosting, Feishu custom-robot webhook.

## Global Constraints

- Public read access requires no account or password.
- Use the approved dark navy dashboard style with teal accents and an A-style answer-first daily brief.
- The homepage leads with exactly one latest recommendation and keeps history easy to search.
- Persist records in D1; do not use browser storage as the source of truth.
- Keep `INGEST_TOKEN`, `FEISHU_WEBHOOK_URL`, and optional `FEISHU_SIGNING_SECRET` in hosted environment configuration only.
- Every factual metric includes a source URL and capture date; unavailable values display `未公开`.
- A Feishu failure never removes a successfully stored recommendation.
- Version one excludes login, an admin editor, and Feishu Base synchronization.

---

## File Map

- `.openai/hosting.json`: Sites project metadata and logical D1 binding `DB`.
- `.openai/drizzle/0000_create_recommendations.sql`: durable database migration.
- `app/lib/recommendations/types.ts`: shared report and list-item types.
- `app/lib/recommendations/validate.ts`: ingestion validation and normalization.
- `app/lib/recommendations/repository.ts`: all D1 reads and idempotent upserts.
- `app/lib/feishu.ts`: Feishu card creation and webhook delivery.
- `app/api/recommendations/route.ts`: protected ingestion and public list endpoint.
- `app/api/recommendations/[slug]/route.ts`: public detail endpoint.
- `app/components/*`: focused dashboard, evidence, risk, media, and archive components.
- `app/page.tsx`: latest-recommendation dashboard.
- `app/archive/page.tsx`: searchable history.
- `app/trends/page.tsx`: statistics derived only from saved records.
- `app/recommendations/[slug]/page.tsx`: complete report detail.
- `app/globals.css`: approved responsive dark visual system.
- `app/layout.tsx`: Chinese metadata and share-card metadata.
- `tests/*`: validation, repository, Feishu payload, filters, and rendering tests.
- `scripts/seed-today.ts`: one-time insertion of the validated test report.

### Task 1: Scaffold the Sites Application and Durable Schema

**Files:**
- Create through initializer: `package.json`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `.openai/hosting.json`
- Create: `.openai/drizzle/0000_create_recommendations.sql`
- Create: `app/lib/recommendations/types.ts`
- Create: `tests/report-types.test.ts`

**Interfaces:**
- Produces: `RecommendationReport`, `RecommendationListItem`, and a D1 table named `recommendations` used by every later task.

- [ ] **Step 1: Initialize the Sites starter and add the test runner**

Run the Sites initializer once in the project root, preserve its package manager, then add `vitest` and a `test` script. Configure `.openai/hosting.json` with logical D1 binding `DB` and no R2 binding.

- [ ] **Step 2: Write the failing type-shape test**

```ts
import { describe, expect, it } from "vitest";
import type { RecommendationReport } from "../app/lib/recommendations/types";

describe("RecommendationReport", () => {
  it("represents a sourced bilingual recommendation", () => {
    const report: RecommendationReport = {
      date: "2026-07-13",
      slug: "mini-thermal-printer",
      product: { zh: "迷你蓝牙热敏打印机", es: "Mini impresora térmica", keywords: ["mini thermal printer"] },
      category: "便携打印设备",
      scenarios: ["学习笔记"],
      audience: ["学生"],
      platforms: ["MKD", "TK"],
      metrics: { price: 278.91, currency: "MXN", sold: 5000, rating: 4.8, reviews: 947, discount: 47 },
      trend: { status: "hot", label: "稳定热卖", evidence: [] },
      reasons: ["已有公开销量验证"],
      supplyChain: { purchaseUsdMin: 5, purchaseUsdMax: 10, retailMxnMin: 349, retailMxnMax: 449 },
      electronics: { battery: "1000mAh rechargeable lithium", charging: "5V USB", chip: "Bluetooth and thermal-print controller" },
      risks: ["锂电运输"],
      nextAction: "采购5至10台测试",
      verdict: "recommend",
      media: [],
      sources: [],
    };
    expect(report.platforms).toContain("MKD");
  });
});
```

- [ ] **Step 3: Run the test and confirm the missing module failure**

Run: `pnpm test -- tests/report-types.test.ts`

Expected: FAIL because `app/lib/recommendations/types.ts` does not exist.

- [ ] **Step 4: Add the shared types and database migration**

Define exact unions `Platform = "TK" | "MKD" | "TM"`, `Verdict = "recommend" | "watch" | "reject"`, `TrendStatus = "hot" | "rising" | "stable"`, and the nested fields used in Step 2. Create one SQL migration with table columns `id`, `date`, `slug`, `product_zh`, `product_es`, `keywords`, `category`, `platforms`, `price`, `currency`, `trend_status`, `verdict`, `report_json`, `feishu_status`, `feishu_error`, `feishu_pushed_at`, and `created_at`; add unique indexes for `slug` and `date`.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test -- tests/report-types.test.ts`

Expected: PASS.

Commit: `feat: scaffold product radar data model`

### Task 2: Validate Reports and Implement Idempotent D1 Access

**Files:**
- Create: `app/lib/recommendations/validate.ts`
- Create: `app/lib/recommendations/repository.ts`
- Create: `tests/validate-report.test.ts`
- Create: `tests/repository.test.ts`

**Interfaces:**
- Consumes: `RecommendationReport` and D1 binding `DB`.
- Produces: `validateReport(value: unknown): RecommendationReport`, `upsertRecommendation(db, report)`, `listRecommendations(db, filters)`, and `getRecommendation(db, slug)`.

- [ ] **Step 1: Write failing validation tests**

```ts
import { describe, expect, it } from "vitest";
import { validateReport } from "../app/lib/recommendations/validate";

describe("validateReport", () => {
  it("rejects a report without source dates", () => {
    expect(() => validateReport({ date: "2026-07-13", slug: "x", sources: [{ url: "https://example.com" }] }))
      .toThrow(/source.*capturedAt/i);
  });
  it("rejects non-http media URLs", () => {
    expect(() => validateReport({ date: "2026-07-13", slug: "x", media: [{ type: "image", url: "javascript:alert(1)" }] }))
      .toThrow(/url/i);
  });
});
```

- [ ] **Step 2: Run tests and confirm failures**

Run: `pnpm test -- tests/validate-report.test.ts tests/repository.test.ts`

Expected: FAIL because validation and repository modules do not exist.

- [ ] **Step 3: Implement strict validation and repository functions**

Validation must require ISO date, lowercase hyphenated slug, all product names, at least one platform, at least two trend evidence entries, at least one recommendation reason, a verdict, and `capturedAt` on every source. Accept only `https:` URLs. Repository writes use prepared statements and `ON CONFLICT(slug) DO UPDATE`, storing the complete report as JSON. Public reads parse `report_json` and never select environment secrets.

- [ ] **Step 4: Test idempotency with a fake D1 adapter**

The repository test submits the same slug twice, asserts one logical record, and asserts the second payload replaces the first price while preserving the unique slug.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test -- tests/validate-report.test.ts tests/repository.test.ts`

Expected: PASS.

Commit: `feat: validate and persist recommendations`

### Task 3: Add Protected Ingestion and Feishu Delivery

**Files:**
- Create: `app/lib/feishu.ts`
- Create: `app/api/recommendations/route.ts`
- Create: `app/api/recommendations/[slug]/route.ts`
- Create: `tests/feishu.test.ts`
- Create: `tests/ingestion-route.test.ts`

**Interfaces:**
- Consumes: `validateReport`, repository functions, `INGEST_TOKEN`, `FEISHU_WEBHOOK_URL`, and optional `FEISHU_SIGNING_SECRET`.
- Produces: `buildFeishuCard(report, publicUrl)`, `pushFeishuCard`, protected `POST /api/recommendations`, public `GET /api/recommendations`, and public `GET /api/recommendations/:slug`.

- [ ] **Step 1: Write failing Feishu payload and authorization tests**

```ts
it("includes a public detail button", () => {
  const card = buildFeishuCard(report, "https://example.com/recommendations/mini-thermal-printer");
  expect(JSON.stringify(card)).toContain("查看完整报告");
  expect(JSON.stringify(card)).toContain("mini-thermal-printer");
});

it("rejects ingestion without the bearer token", async () => {
  const response = await POST(new Request("https://example.com/api/recommendations", { method: "POST", body: "{}" }));
  expect(response.status).toBe(401);
});
```

- [ ] **Step 2: Run tests and confirm failures**

Run: `pnpm test -- tests/feishu.test.ts tests/ingestion-route.test.ts`

Expected: FAIL because the modules and route do not exist.

- [ ] **Step 3: Implement ingestion and Feishu card delivery**

The POST route compares `Authorization: Bearer <token>` with `INGEST_TOKEN`, validates JSON, upserts first, derives the public detail URL from the request origin, and then sends the Feishu card. Return `201` with `{ slug, url, feishu: "sent" }`; if Feishu fails, retain the record and return `202` with `{ slug, url, feishu: "failed" }`. The card contains product name, platforms, price, trend label, verdict, two reasons, and a detail button.

- [ ] **Step 4: Add public read routes and error responses**

List GET accepts `q`, `platform`, `verdict`, and `trend` parameters. Detail GET returns `404` for a missing slug. All failures return Chinese user-readable messages and stable machine codes.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test -- tests/feishu.test.ts tests/ingestion-route.test.ts`

Expected: PASS.

Commit: `feat: ingest reports and push Feishu cards`

### Task 4: Build the Approved Dashboard, Archive, Trends, and Detail Pages

**Files:**
- Create: `app/components/site-header.tsx`
- Create: `app/components/metric-card.tsx`
- Create: `app/components/daily-brief.tsx`
- Create: `app/components/archive-filters.tsx`
- Create: `app/components/history-card.tsx`
- Create: `app/components/source-list.tsx`
- Create: `app/components/media-list.tsx`
- Modify: `app/page.tsx`
- Create: `app/archive/page.tsx`
- Create: `app/trends/page.tsx`
- Create: `app/recommendations/[slug]/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `tests/archive-filter.test.ts`
- Create: `tests/daily-brief.test.tsx`

**Interfaces:**
- Consumes: public recommendation list/detail functions.
- Produces: four responsive public pages and `filterRecommendations(items, filters)`.

- [ ] **Step 1: Write failing archive and server-render tests**

```ts
it("matches Chinese, Spanish, and English terms", () => {
  expect(filterRecommendations(items, { q: "impresora" })).toHaveLength(1);
  expect(filterRecommendations(items, { q: "打印机" })).toHaveLength(1);
  expect(filterRecommendations(items, { q: "thermal" })).toHaveLength(1);
});

it("renders the latest product as the page headline", () => {
  const html = renderToStaticMarkup(<DailyBrief report={report} />);
  expect(html).toContain("迷你蓝牙热敏打印机");
  expect(html).toContain("MXN");
});
```

- [ ] **Step 2: Run tests and confirm failures**

Run: `pnpm test -- tests/archive-filter.test.ts tests/daily-brief.test.tsx`

Expected: FAIL because the components and filter function do not exist.

- [ ] **Step 3: Implement the B-style visual system with A-style content hierarchy**

Use `#0b1220` page background, `#131d2e` and `#182235` cards, `#273449` borders, `#5eead4` teal highlights, and high-contrast off-white text. Desktop homepage uses a product media column plus decision-data column; below 760px it becomes a single column with 44px minimum touch targets. Do not use decorative SVG artwork.

- [ ] **Step 4: Implement all routes and states**

Homepage shows latest report, key metrics, reasons, risks, next action, channel badges, and recent history. Archive supports search and filters. Trends derives only count, platform distribution, verdict distribution, and price range from stored records. Detail renders all sources, media, electronics, supply-chain notes, risks, and adjacent navigation. Empty state says `今日暂无合格推荐` and links to history.

- [ ] **Step 5: Replace starter metadata and remove preview-only starter assets**

Set title to `墨西哥新品雷达`, description to `每日追踪墨西哥 TK、Mercado Libre 与 Temu 的带电带芯片热卖新品`, and remove starter preview imports, metadata, icons, and unused loading-skeleton dependency.

- [ ] **Step 6: Run tests, build, and commit**

Run: `pnpm test && pnpm build`

Expected: all tests PASS and build exits 0.

Commit: `feat: build public product intelligence dashboard`

### Task 5: Seed Today, Publish, Configure Secrets, and Update the Daily Automation

**Files:**
- Create: `scripts/seed-today.ts`
- Modify: existing automation `automation-2` through the Codex automation interface.
- Modify hosted configuration through Sites environment settings; do not create a plaintext secrets file.

**Interfaces:**
- Consumes: deployed ingestion URL, `INGEST_TOKEN`, Feishu webhook, and the validated 2026-07-13 thermal-printer report.
- Produces: public site URL, first historical record, Feishu test card, and a daily 10:00 automation that writes and pushes future reports.

- [ ] **Step 1: Add and validate the first full report**

Create a complete `RecommendationReport` for the already researched mini Bluetooth thermal printer with its Mercado Libre, TikTok Creative Center, TikTok Shop, technical-specification, and supplier sources. Run it through `validateReport` before sending.

- [ ] **Step 2: Build and publish the exact validated source**

Run: `pnpm test && pnpm build`

Expected: all tests PASS and build exits 0. Publish through Sites, configure a public access policy, and verify the deployment reaches a successful state.

- [ ] **Step 3: Configure protected runtime values**

Generate a high-entropy `INGEST_TOKEN` and store it as a secret runtime value. After creating the Feishu group robot, store `FEISHU_WEBHOOK_URL` and optional signing secret as secret runtime values, then redeploy the same saved version so the runtime revision applies.

- [ ] **Step 4: Seed and verify the live record**

POST the validated report with the bearer token. Verify the public homepage and detail endpoint return the product, the archive contains exactly one 2026-07-13 record, and a repeated POST does not add a duplicate.

- [ ] **Step 5: Update the daily 10:00 automation**

Keep the existing research rules, then append these requirements: produce the exact JSON schema, POST it to the deployed ingestion endpoint with the protected bearer token, treat HTTP 201 and 202 as a saved report, include the returned public URL in the Codex summary, and never expose either secret in output.

- [ ] **Step 6: Perform end-to-end verification and commit**

Verify: public anonymous access, mobile-readable HTML, archive search, missing-slug 404, unauthorized POST 401, idempotent repeat POST, live Feishu card, and working detail button.

Commit: `chore: seed and automate daily product reports`
