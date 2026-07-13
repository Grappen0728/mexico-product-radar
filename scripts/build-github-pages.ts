import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STATIC_REPORTS } from "../app/lib/recommendations/static-data";
import { STATIC_DAILY_BRIEFS } from "../app/lib/daily-briefs/static-data";
import { renderArchive, renderDailyBriefHome, renderDailyBriefPage, renderHome, renderRecommendation, renderTrends, siteHref } from "../app/lib/static-site/render";

async function writePage(outputDir: string, path: string, content: string): Promise<void> {
  const target = resolve(outputDir, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

function assertSafeOutput(root: string, outputDir: string): void {
  const target = resolve(outputDir);
  const project = resolve(root);
  if (target === project || target === dirname(project) || target.length < 8) {
    throw new Error("拒绝清理不安全的静态站输出目录");
  }
}

export async function buildGitHubPages(
  root: string,
  outputDir: string,
  basePath: string,
): Promise<string[]> {
  assertSafeOutput(root, outputDir);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(resolve(outputDir, "assets"), { recursive: true });

  const css = (await readFile(resolve(root, "app/globals.css"), "utf8"))
    .replace(/^@import\s+["']tailwindcss["'];?\s*/u, "");
  await writeFile(resolve(outputDir, "assets/styles.css"), css, "utf8");
  await copyFile(resolve(root, "public/github-pages.js"), resolve(outputDir, "assets/site.js"));
  await writeFile(resolve(outputDir, ".nojekyll"), "", "utf8");

  const options = { basePath };
  const files = [".nojekyll", "assets/styles.css", "assets/site.js"];
  const dailyReports = STATIC_DAILY_BRIEFS.flatMap((brief) => brief.recommendations.map((item) => item.report));
  const reports = [...dailyReports, ...STATIC_REPORTS].filter((report, index, items) => items.findIndex((item) => item.slug === report.slug) === index);
  const latestBrief = STATIC_DAILY_BRIEFS[0];
  await writePage(outputDir, "index.html", latestBrief ? renderDailyBriefHome(latestBrief, STATIC_REPORTS, options) : renderHome(STATIC_REPORTS, options));
  files.push("index.html");
  await writePage(outputDir, "archive/index.html", renderArchive(reports, options));
  files.push("archive/index.html");
  await writePage(outputDir, "trends/index.html", renderTrends(reports, options));
  files.push("trends/index.html");

  for (const report of reports) {
    const path = `recommendations/${report.slug}/index.html`;
    await writePage(outputDir, path, renderRecommendation(report, options));
    files.push(path);
  }

  for (const brief of STATIC_DAILY_BRIEFS) {
    const path = `briefs/${brief.slug}/index.html`;
    await writePage(outputDir, path, renderDailyBriefPage(brief, options));
    files.push(path);
  }

  const notFound = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>页面不存在｜墨西哥选品雷达</title><link rel="stylesheet" href="${siteHref(basePath, "/assets/styles.css")}"></head><body><main class="shell"><div class="empty-state"><h1>页面不存在</h1><a href="${siteHref(basePath, "/")}">返回今日推荐</a></div></main></body></html>`;
  await writePage(outputDir, "404.html", notFound);
  files.push("404.html");
  return files;
}

function argument(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const root = resolve(dirname(scriptPath), "..");
  const outputArg = argument("--output") ?? "dist-pages";
  const outputDir = isAbsolute(outputArg) ? outputArg : resolve(root, outputArg);
  const basePath = argument("--base-path") ?? "/mexico-product-radar";
  const files = await buildGitHubPages(root, outputDir, basePath);
  console.log(`GitHub Pages 已生成 ${files.length} 个文件：${relative(root, outputDir)}`);
}
