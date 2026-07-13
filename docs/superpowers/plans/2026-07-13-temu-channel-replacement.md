# Temu Mexico Channel Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Amazon Mexico with Temu Mexico across daily brief validation, rendering, content, delivery, and automation without breaking legacy Amazon records.

**Architecture:** Keep the existing three-channel brief model and replace only the second daily channel with `temu-mx`, mapped to the existing `TM` report platform. Preserve `AMZ` in the legacy recommendation model, while current daily briefs, static pages, Feishu output, and scheduled generation use Temu-specific copy and evidence.

**Tech Stack:** TypeScript, React 19, vinext, Vitest, static HTML generation, GitHub Pages, Feishu webhook delivery, Codex automation.

## Global Constraints

- Fixed order: TikTok Shop Mexico, Temu Mexico, Mercado Libre Mexico.
- Products must be electric and contain a chip or controller.
- Each recommendation must include at least two dated public sources.
- Never invent sales, GMV, reviews, prices, or procurement costs.
- Keep the existing dark navy and teal layout, ranking, history, public sharing, and 10:07 daily schedule.
- Preserve legacy `AMZ` report compatibility; new daily briefs use `TM` only.

---

### Task 1: Daily channel contract

**Files:**
- Modify: `app/lib/daily-briefs/types.ts`
- Modify: `app/lib/daily-briefs/validate.ts`
- Modify: `tests/daily-brief-validation.test.ts`
- Modify: `tests/fixtures/daily-brief.ts`

**Interfaces:**
- Produces: `DailyChannel = "tiktok-mx" | "temu-mx" | "mercado-libre-mx"` and `CHANNEL_PLATFORM["temu-mx"] = "TM"`.

- [ ] Add a failing validation test asserting that a second-channel Amazon record is rejected and a Temu/TM record is accepted.
- [ ] Run `pnpm vitest run tests/daily-brief-validation.test.ts --config vitest.config.ts` and confirm the Temu case fails because `temu-mx` is not yet a valid daily channel.
- [ ] Replace the second daily channel and its platform mapping, and update the fixed-order validation message.
- [ ] Update the shared fixture to use a Temu/TM report and run the focused test until it passes.

### Task 2: Temu labels and platform-specific presentation

**Files:**
- Modify: `app/components/platform-recommendation-card.tsx`
- Modify: `app/lib/static-site/render.ts`
- Modify: `app/lib/feishu.ts`
- Modify: `public/github-pages.js`
- Modify: `tests/three-platform-ui.test.ts`
- Modify: `tests/static-daily-brief-render.test.ts`
- Modify: `tests/daily-feishu.test.ts`
- Modify: `tests/build-github-pages.test.ts`

**Interfaces:**
- Consumes: the `temu-mx` daily channel contract from Task 1.
- Produces: Temu labels and `TM` archive filtering in React, static HTML, and Feishu output.

- [ ] Change UI, static-render, Feishu, and archive-filter expectations to Temu Mexico/TM and run the four focused test files to observe failures against the Amazon implementation.
- [ ] Implement Temu labels, keep TikTok's video-specific label, and use a Temu-appropriate sales-potential label and playbook heading.
- [ ] Replace the dynamic AMZ archive insertion with TM while retaining legacy AMZ options when rendered data contains them.
- [ ] Run the focused tests and confirm all pass.

### Task 3: Replace today's Amazon recommendation with researched Temu content

**Files:**
- Modify: `data/daily-briefs/2026-07-13.json`
- Modify: `data/daily-briefs/README.md`
- Modify: `tests/publication-safety.test.ts`

**Interfaces:**
- Produces: one validated `temu-mx` recommendation whose nested report uses `platforms: ["TM"]`, plus an updated three-product ranking.

- [ ] Research a current Temu Mexico electric/chip product using at least two public sources and record only verifiable signals.
- [ ] Add or update a publication-safety assertion requiring `TM`, two dated sources, electric detail, and chip detail; run it and confirm failure against the Amazon brief.
- [ ] Replace the Amazon JSON object, ranking slug, reasons, media, prices, risk notes, and `sourcesCheckedAt`; update the authoring README with the Temu logic.
- [ ] Run validation, publication-safety, and static-render tests until they pass.

### Task 4: Full regression and public builds

**Files:**
- Generated: `dist/**`
- Generated: `dist-pages/**`

**Interfaces:**
- Consumes: the validated source and content from Tasks 1-3.
- Produces: deployable Sites and GitHub Pages outputs.

- [ ] Run `pnpm test:unit` and fix any remaining Amazon daily-channel expectations.
- [ ] Run `pnpm pages:build` followed by `node --test tests/rendered-html.test.mjs` and confirm the generated HTML contains Temu Mexico and no current Amazon brief.
- [ ] Run `pnpm build` and confirm a clean production build.

### Task 5: Publish, update scheduling, and resend

**Files:**
- Modify only if needed: `.openai/hosting.json`

**Interfaces:**
- Consumes: the successful outputs from Task 4.
- Produces: updated public URLs, a Temu-aware 10:07 automation, and a corrected Feishu delivery.

- [ ] Publish the validated Sites version and the established GitHub Pages branch using the existing project configuration.
- [ ] Update the existing daily automation prompt so the second platform is Temu Mexico and its scoring follows the approved Temu logic; keep 10:07 Asia/Shanghai.
- [ ] Send the corrected 2026-07-13 brief to the configured Feishu webhook once.
- [ ] Open the public site, verify the Temu card and daily detail link, and record the final URLs.

## Self-Review

- Spec coverage: channel contract, Temu logic, today's replacement, UI, static pages, Feishu, scheduling, compatibility, publication, and validation are each assigned to a task.
- Placeholder scan: no deferred implementation placeholders remain.
- Type consistency: `temu-mx` maps to the existing `TM` platform code throughout the plan.
