# GitHub Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the Mexico Product Radar as a no-login GitHub Pages site, verify each daily detail page before sending Feishu, and stop using the blocked `chatgpt.site` URL in user-facing links.

**Architecture:** Keep validated recommendation JSON and TypeScript data as the content source, then generate a separate pure-static site into `dist-pages/`. A GitHub Actions Pages workflow deploys that directory from a public `mexico-product-radar` repository; the local automation waits for the exact product detail page before sending Feishu.

**Tech Stack:** TypeScript, Node.js 24, Vitest, static HTML/CSS/JavaScript, GitHub Pages, GitHub Actions, Feishu custom bot.

## Global Constraints

- Public access must require no password or GitHub login.
- Preserve `/`, `/archive/`, `/trends/`, and `/recommendations/<slug>/` page roles.
- Keep the existing dark dashboard appearance and Chinese content.
- Never commit `.env.automation`, webhooks, signing secrets, Sites tokens, or account credentials.
- Publish and verify the exact online detail page before sending Feishu.
- If no qualified product exists, do not create a fake report.
- The existing `chatgpt.site` deployment remains a backup only.

---

### Task 1: Static URL and HTML renderer

**Files:**
- Create: `app/lib/static-site/render.ts`
- Test: `tests/static-site-render.test.ts`

**Interfaces:**
- Consumes: `RecommendationReport` from `app/lib/recommendations/types.ts`.
- Produces: `normalizeBasePath(basePath: string): string`, `siteHref(basePath: string, path: string): string`, `renderHome(reports, options): string`, `renderArchive(reports, options): string`, `renderTrends(reports, options): string`, and `renderRecommendation(report, options): string`.

- [ ] **Step 1: Write the failing URL and renderer tests**

```ts
import { describe, expect, it } from "vitest";
import { SAMPLE_REPORT } from "../app/lib/recommendations/sample";
import { renderRecommendation, siteHref } from "../app/lib/static-site/render";

describe("GitHub Pages static renderer", () => {
  it("prefixes project-site links with the repository base path", () => {
    expect(siteHref("/mexico-product-radar", "/archive/"))
      .toBe("/mexico-product-radar/archive/");
  });

  it("renders a product detail with source and media links", () => {
    const html = renderRecommendation(SAMPLE_REPORT, { basePath: "/mexico-product-radar" });
    expect(html).toContain(SAMPLE_REPORT.product.zh);
    expect(html).toContain("趋势证据");
    expect(html).toContain(SAMPLE_REPORT.sources[0].url);
    expect(html).toContain("/mexico-product-radar/archive/");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/static-site-render.test.ts --config vitest.config.ts`

Expected: FAIL because `app/lib/static-site/render.ts` does not exist.

- [ ] **Step 3: Implement the renderer**

Create focused escaping, page-shell, navigation, metric, evidence, media, and source helpers in `render.ts`. Export the exact interfaces above and use `escapeHtml()` for all report text while allowing only already validated HTTPS URLs in link attributes.

```ts
export interface StaticRenderOptions { basePath: string }

export function normalizeBasePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

export function siteHref(basePath: string, path: string): string {
  const base = normalizeBasePath(basePath);
  const suffix = `/${path.replace(/^\/+/, "")}`;
  return `${base}${suffix}`;
}
```

The four render functions return complete UTF-8 HTML documents and reference `${siteHref(options.basePath, "/assets/styles.css")}`.

- [ ] **Step 4: Run the targeted tests and verify GREEN**

Run: `pnpm exec vitest run tests/static-site-render.test.ts --config vitest.config.ts`

Expected: 1 test file and 2 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add app/lib/static-site/render.ts tests/static-site-render.test.ts
git commit -m "feat: render static product radar pages"
```

### Task 2: Static site generator and archive behavior

**Files:**
- Create: `scripts/build-github-pages.ts`
- Create: `public/github-pages.js`
- Modify: `package.json`
- Test: `tests/build-github-pages.test.ts`

**Interfaces:**
- Consumes: `STATIC_REPORTS` and the render functions from Task 1.
- Produces: `buildGitHubPages(root: string, outputDir: string, basePath: string): Promise<string[]>`, returning every generated relative path.

- [ ] **Step 1: Write the failing generator test**

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildGitHubPages } from "../scripts/build-github-pages";

describe("GitHub Pages build", () => {
  it("writes the home, archive, trends, detail, assets, and 404 pages", async () => {
    const output = await mkdtemp(join(tmpdir(), "mx-radar-pages-"));
    const files = await buildGitHubPages(process.cwd(), output, "/mexico-product-radar");
    expect(files).toContain("index.html");
    expect(files).toContain("archive/index.html");
    expect(files).toContain("recommendations/mini-thermal-printer-2026-07-13/index.html");
    expect(await readFile(join(output, ".nojekyll"), "utf8")).toBe("");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/build-github-pages.test.ts --config vitest.config.ts`

Expected: FAIL because `buildGitHubPages` is missing.

- [ ] **Step 3: Implement the generator and archive filter script**

`buildGitHubPages()` must remove only the supplied output directory, recreate it, copy `app/globals.css` to `assets/styles.css`, copy `public/github-pages.js` to `assets/site.js`, write `.nojekyll`, and write:

```text
index.html
archive/index.html
trends/index.html
recommendations/<report.slug>/index.html
404.html
```

The archive renderer marks cards with `data-search`, `data-platforms`, and `data-verdict`; `public/github-pages.js` filters those cards from the existing search, platform, and verdict controls without network calls.

Add package scripts:

```json
{
  "pages:build": "tsx scripts/build-github-pages.ts --base-path=/mexico-product-radar",
  "pages:test": "vitest run tests/static-site-render.test.ts tests/build-github-pages.test.ts --config vitest.config.ts"
}
```

- [ ] **Step 4: Verify the generator**

Run: `pnpm pages:test`

Expected: both Pages test files pass.

Run: `pnpm pages:build`

Expected: `dist-pages/` contains the files listed above and reports the generated count.

- [ ] **Step 5: Commit**

```powershell
git add app/lib/static-site scripts/build-github-pages.ts public/github-pages.js package.json tests
git commit -m "feat: build GitHub Pages archive"
```

### Task 3: Pages workflow and secret guard

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `.gitignore`
- Create: `tests/publication-safety.test.ts`

**Interfaces:**
- Consumes: `pnpm pages:build` and the committed lockfile.
- Produces: a GitHub Pages artifact named `github-pages` from `dist-pages/`.

- [ ] **Step 1: Write the failing publication-safety test**

```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public repository safety", () => {
  it("keeps private automation configuration out of Git", async () => {
    const ignore = await readFile(".gitignore", "utf8");
    expect(ignore).toContain(".env.automation");
    expect(ignore).toContain("dist-pages/");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run tests/publication-safety.test.ts --config vitest.config.ts`

Expected: FAIL until `dist-pages/` is ignored.

- [ ] **Step 3: Add the workflow and ignore rule**

Use this workflow contract:

```yaml
name: Deploy GitHub Pages
on:
  push:
    branches: [master]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm pages:test
      - run: pnpm pages:build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist-pages
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Run safety and full verification**

Run: `pnpm test:unit`

Expected: all unit tests pass.

Run: `pnpm pages:build`

Expected: static site builds successfully.

Run: `git grep -n -E "(FEISHU_WEBHOOK_URL=|FEISHU_SIGNING_SECRET=|OAI-Sites-Authorization:)" -- ':!docs/superpowers/**'`

Expected: no tracked secret values.

- [ ] **Step 5: Commit**

```powershell
git add .github/workflows/pages.yml .gitignore tests/publication-safety.test.ts
git commit -m "ci: publish product radar to GitHub Pages"
```

### Task 4: Public repository and live deployment

**Files:**
- Modify: local Git remote configuration only; no credential files.

**Interfaces:**
- Consumes: the clean, fully tested `master` branch.
- Produces: public repository `mexico-product-radar` and its GitHub Pages URL.

- [ ] **Step 1: Confirm the exact authenticated GitHub owner**

Open `https://github.com/settings/profile` in the user's signed-in browser and read the visible account handle. Store it only as a normal repository owner name.

- [ ] **Step 2: Create the public repository**

Create `mexico-product-radar` with visibility **Public**, no generated README, no generated `.gitignore`, and no license so the existing history can be pushed without conflict.

- [ ] **Step 3: Push the verified source**

Add `github` as a separate remote, preserving the existing `sites` remote:

```powershell
git remote add github https://github.com/$owner/mexico-product-radar.git
git push -u github master
```

Use the existing signed-in GitHub session or Git credential flow; never persist tokens in the remote URL.

- [ ] **Step 4: Enable GitHub Actions Pages**

In repository Settings → Pages, select **GitHub Actions** as the build source. Open the Actions run and wait until `Deploy GitHub Pages` succeeds.

- [ ] **Step 5: Verify public access**

Open an unauthenticated/private browser context and verify:

```text
https://$owner.github.io/mexico-product-radar/
https://$owner.github.io/mexico-product-radar/archive/
https://$owner.github.io/mexico-product-radar/recommendations/mini-thermal-printer-2026-07-13/
```

Expected: HTTP success, product title visible, no login prompt, no Cloudflare block page.

### Task 5: Switch Feishu and the daily automation

**Files:**
- Modify: `.env.automation` locally only.
- Modify: Codex automation `automation-2` through the automation API.
- Test: `tests/send-feishu-cli.test.ts`.

**Interfaces:**
- Consumes: the verified GitHub Pages origin from Task 4.
- Produces: Feishu cards and daily runs that use the new origin.

- [ ] **Step 1: Update the local public origin**

Replace only `PUBLIC_SITE_ORIGIN` in `.env.automation` with `https://$owner.github.io/mexico-product-radar`. Preserve both Feishu secret values without printing them.

- [ ] **Step 2: Update daily task ordering and deployment instructions**

Keep the 10:07 schedule. Replace Sites publication with:

```text
push master to the github remote; wait for the Deploy GitHub Pages workflow; verify the exact /recommendations/<slug>/ page; only then run pnpm send:feishu.
```

Keep the no-fabrication rule and secret-output prohibition.

- [ ] **Step 3: Run the sender tests**

Run: `pnpm exec vitest run tests/send-feishu-cli.test.ts --config vitest.config.ts`

Expected: all sender tests pass.

- [ ] **Step 4: Send one corrected test brief**

Send the current `SAMPLE_REPORT` using the new verified GitHub Pages detail URL. Expected: Feishu accepts the card and the button opens the public product detail without a block page.

- [ ] **Step 5: Final verification**

Run: `pnpm test:unit`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Run: `pnpm pages:build`

Expected: every command exits successfully; Git working tree is clean; automation is active at 10:07; newest Feishu card uses the GitHub Pages origin.

