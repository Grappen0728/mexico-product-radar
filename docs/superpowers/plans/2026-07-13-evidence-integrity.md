# Evidence Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every daily recommendation publish only auditable claims, show source/media health, and fall back honestly when paid APIs are unavailable.

**Architecture:** Extend recommendation sources and media with structured provenance, centralize evidence-quality calculations in a pure helper, and enforce stricter rules only for new daily briefs so historical records remain readable. Render the computed audit summary in both the app and GitHub Pages output, while preserving invalid sources as excluded audit records.

**Tech Stack:** TypeScript, React 19, Vitest, vinext, static GitHub Pages renderer

## Global Constraints

- No paid API, login, CAPTCHA, subscription, or rate-limit bypass.
- Exact sales, GMV, rating, or review claims require an accessible official or licensed source.
- Hot or rising claims require two independent usable demand sources, including one Mexico-local source.
- Search pages and tag pages are not direct media.
- Legacy recommendation records must continue to render.

---

### Task 1: Evidence model and quality calculation

**Files:**
- Create: `app/lib/recommendations/evidence-quality.ts`
- Modify: `app/lib/recommendations/types.ts`
- Test: `tests/evidence-quality.test.ts`

**Interfaces:**
- Consumes: `RecommendationReport`, enriched `SourceLink`, enriched `MediaLink`
- Produces: `assessEvidenceQuality(report): EvidenceQualityAssessment`

- [ ] **Step 1: Write failing tests** for usable-source filtering, Mexico coverage, independent publishers, exact-metric provenance, confidence bands, and ranking score caps.
- [ ] **Step 2: Run** `pnpm vitest run tests/evidence-quality.test.ts --config vitest.config.ts` and confirm failures are caused by the missing helper.
- [ ] **Step 3: Add provenance types and the minimal pure calculator**. Keep new source fields optional at the shared report type so historical records still parse.
- [ ] **Step 4: Run the focused test** and confirm all evidence-quality tests pass.
- [ ] **Step 5: Commit** `feat: add auditable evidence quality model`.

### Task 2: Daily publication safety rules

**Files:**
- Modify: `app/lib/daily-briefs/validate.ts`
- Modify: `app/lib/recommendations/validate.ts`
- Test: `tests/daily-brief-validation.test.ts`
- Test: `tests/publication-safety.test.ts`

**Interfaces:**
- Consumes: `assessEvidenceQuality(report)`
- Produces: validation errors for missing provenance, insufficient independent/local evidence, invalid precise metrics, and unsafe TOP 1 rankings

- [ ] **Step 1: Add failing validation cases** for a CAPTCHA-backed exact sale count, a hot claim with one publisher, missing Mexico evidence, and a TOP 1 score above its evidence cap.
- [ ] **Step 2: Run the two focused test files** and confirm each new case fails for the intended missing rule.
- [ ] **Step 3: Implement the minimal daily-only publication checks** and preserve legacy `validateReport` compatibility.
- [ ] **Step 4: Run the focused tests** and confirm they pass.
- [ ] **Step 5: Commit** `feat: enforce evidence publication gates`.

### Task 3: Trust and media UI

**Files:**
- Modify: `app/components/source-list.tsx`
- Modify: `app/components/media-list.tsx`
- Modify: `app/components/platform-recommendation-card.tsx`
- Modify: `app/lib/static-site/render.ts`
- Modify: `app/globals.css`
- Test: `tests/static-daily-brief-render.test.ts`
- Test: `tests/static-site-render.test.ts`

**Interfaces:**
- Consumes: `EvidenceQualityAssessment`, source access states, direct-media metadata
- Produces: confidence summary, evidence coverage, source status badges, embedded thumbnails, and explicit unavailable-media states

- [ ] **Step 1: Add failing renderer assertions** for confidence, coverage, source grade/status, last checked time, thumbnail markup, and unavailable video copy.
- [ ] **Step 2: Run focused renderer tests** and confirm the new strings/markup are absent.
- [ ] **Step 3: Implement the audit panel and safe media/source renderers** in React and static HTML.
- [ ] **Step 4: Add responsive styles and rerun focused tests**.
- [ ] **Step 5: Commit** `feat: show evidence confidence and media health`.

### Task 4: Repair today's report and source fallbacks

**Files:**
- Modify: `data/daily-briefs/2026-07-13.json`
- Modify: `tests/static-data.test.ts`
- Test: `tests/source-health.test.ts`

**Interfaces:**
- Consumes: publication rules from Task 2
- Produces: a publishable daily brief whose exact claims and media are supported by usable URLs or explicitly unavailable

- [ ] **Step 1: Add a failing data test** that rejects generic video searches/tags, invalid Alibaba redirects, CAPTCHA-only metric support, and missing provenance.
- [ ] **Step 2: Run focused tests** and record the expected failures against the current JSON.
- [ ] **Step 3: Replace or downgrade claims and links**: set unsupported precise metrics to null, add accessible independent Mexico evidence, use direct media when verifiable, and mark unavailable items without counting them.
- [ ] **Step 4: Run focused validation and source-health tests** and confirm the report passes publication rules.
- [ ] **Step 5: Commit** `content: repair daily brief evidence and media`.

### Task 5: Build, deploy, and verify

**Files:**
- Modify generated static output only through `scripts/build-github-pages.ts`

**Interfaces:**
- Consumes: validated source state
- Produces: GitHub Pages output and a Sites deployment of the same verified application source

- [ ] **Step 1: Run** `pnpm test` and require zero failures.
- [ ] **Step 2: Run** `pnpm pages:build` and check the daily brief HTML for audit labels and no generic media search links.
- [ ] **Step 3: Publish the verified GitHub Pages source through the existing repository workflow.**
- [ ] **Step 4: Package and publish the same validated app through Sites using the existing project configuration.**
- [ ] **Step 5: Open the public result and verify the daily brief, product pages, source status labels, image fallbacks, and history navigation.
