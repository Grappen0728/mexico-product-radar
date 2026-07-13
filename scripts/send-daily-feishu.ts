import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushDailyBriefFeishuCard } from "../app/lib/feishu";
import { STATIC_DAILY_BRIEFS } from "../app/lib/daily-briefs/static-data";
import type { DailyPlatformBrief } from "../app/lib/daily-briefs/types";
import { validateDailyBrief } from "../app/lib/daily-briefs/validate";
import { parseEnvFile, resolveReportArg } from "./send-feishu";

export function assertDailyBriefIsPublished(brief: DailyPlatformBrief, published: DailyPlatformBrief[]): void {
  if (!published.some((item) => item.slug === brief.slug)) throw new Error(`日报 ${brief.slug} 尚未发布到网站，已停止飞书推送`);
}

export async function sendDailyBrief(briefPath: string, root: string): Promise<void> {
  const values = parseEnvFile(await readFile(resolve(root, ".env.automation"), "utf8"));
  if (!values.FEISHU_WEBHOOK_URL || !values.FEISHU_SIGNING_SECRET || !values.PUBLIC_SITE_ORIGIN) throw new Error(".env.automation 缺少飞书或公开站点配置");
  const brief = validateDailyBrief(JSON.parse(await readFile(resolve(root, briefPath), "utf8")));
  assertDailyBriefIsPublished(brief, STATIC_DAILY_BRIEFS);
  await pushDailyBriefFeishuCard({
    webhookUrl: values.FEISHU_WEBHOOK_URL,
    signingSecret: values.FEISHU_SIGNING_SECRET,
    brief,
    publicUrl: `${values.PUBLIC_SITE_ORIGIN.replace(/\/$/, "")}/briefs/${brief.slug}/`,
  });
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const briefPath = resolveReportArg(process.argv.slice(2));
  if (!briefPath) throw new Error("用法：pnpm send:daily-feishu -- data/daily-briefs/YYYY-MM-DD.json");
  await sendDailyBrief(briefPath, resolve(dirname(scriptPath), ".."));
  console.log("飞书三平台日报推送成功");
}
