import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("defines the product radar dashboard and metadata", async () => {
  const [page, brief, sample, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/daily-brief.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/recommendations/sample.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /墨西哥新品雷达/);
  assert.match(sample, /迷你蓝牙热敏打印机/);
  assert.match(brief, /为什么推荐/);
  assert.match(page, /历史推荐/);
  assert.match(css, /--teal:#5eead4/);
  assert.match(css, /\.filter-bar\{grid-template-columns:minmax\(0,1fr\) repeat\(3,160px\)\}/);
  assert.doesNotMatch(`${page}${layout}`, /codex-preview|react-loading-skeleton/);
});

test("removes all starter-only preview assets and metadata", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /墨西哥新品雷达/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
