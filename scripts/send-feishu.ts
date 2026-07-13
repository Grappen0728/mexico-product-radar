import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushFeishuCard } from "../app/lib/feishu";
import { STATIC_REPORTS } from "../app/lib/recommendations/static-data";
import type { RecommendationReport } from "../app/lib/recommendations/types";
import { validateReport } from "../app/lib/recommendations/validate";

export function parseEnvFile(content: string): Record<string, string> {
  return Object.fromEntries(
    content.split(/\r?\n/).flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return [];
      const separator = trimmed.indexOf("=");
      if (separator < 1) return [];
      return [[trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim()]];
    }),
  );
}

export function resolveReportArg(args: string[]): string | undefined {
  return args.find((value) => value !== "--");
}

export function assertReportIsPublished(
  report: RecommendationReport,
  publishedReports: RecommendationReport[],
): void {
  if (!publishedReports.some((published) => published.slug === report.slug)) {
    throw new Error(`简报 ${report.slug} 尚未发布到网站，已停止飞书推送`);
  }
}

export async function sendReport(reportPath: string, root: string): Promise<void> {
  const values = parseEnvFile(await readFile(resolve(root, ".env.automation"), "utf8"));
  const webhookUrl = values.FEISHU_WEBHOOK_URL;
  const signingSecret = values.FEISHU_SIGNING_SECRET;
  const publicOrigin = values.PUBLIC_SITE_ORIGIN;
  if (!webhookUrl || !signingSecret || !publicOrigin) {
    throw new Error(".env.automation 缺少飞书或公开站点配置");
  }
  const report = validateReport(JSON.parse(await readFile(resolve(root, reportPath), "utf8")));
  assertReportIsPublished(report, STATIC_REPORTS);
  await pushFeishuCard({
    webhookUrl,
    signingSecret,
    report,
    publicUrl: `${publicOrigin}/recommendations/${report.slug}`,
  });
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const reportPath = resolveReportArg(process.argv.slice(2));
  if (!reportPath) throw new Error("用法：pnpm send:feishu -- data/recommendations/YYYY-MM-DD-product.json");
  const root = resolve(dirname(scriptPath), "..");
  await sendReport(reportPath, root);
  console.log("飞书推送成功");
}
