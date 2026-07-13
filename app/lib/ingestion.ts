import { pushFeishuCard } from "./feishu";
import {
  updateFeishuStatus,
  upsertRecommendation,
  type D1DatabaseLike,
} from "./recommendations/repository";
import { validateReport } from "./recommendations/validate";

export interface IngestionDependencies {
  db: D1DatabaseLike;
  ingestToken: string;
  publicOrigin?: string;
  feishuWebhookUrl?: string;
  feishuSigningSecret?: string;
  fetchFn?: typeof fetch;
}

function jsonError(status: number, code: string, error: string): Response {
  return Response.json({ code, error }, { status });
}

export function createIngestionHandler(deps: IngestionDependencies) {
  return async function POST(request: Request): Promise<Response> {
    if (request.headers.get("authorization") !== `Bearer ${deps.ingestToken}`) {
      return jsonError(401, "UNAUTHORIZED", "写入凭证无效");
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return jsonError(400, "INVALID_JSON", "请求内容不是有效 JSON");
    }

    let report;
    try {
      report = validateReport(payload);
    } catch (error) {
      return jsonError(400, "INVALID_REPORT", error instanceof Error ? error.message : "报告格式无效");
    }

    try {
      await upsertRecommendation(deps.db, report);
    } catch (error) {
      return jsonError(500, "DATABASE_ERROR", error instanceof Error ? error.message : "保存报告失败");
    }

    const origin = deps.publicOrigin ?? new URL(request.url).origin;
    const url = `${origin}/recommendations/${report.slug}`;
    if (!deps.feishuWebhookUrl) {
      await updateFeishuStatus(deps.db, report.slug, "failed", "飞书机器人尚未配置");
      return Response.json({ slug: report.slug, url, feishu: "failed" }, { status: 202 });
    }

    try {
      await pushFeishuCard({
        webhookUrl: deps.feishuWebhookUrl,
        signingSecret: deps.feishuSigningSecret,
        report,
        publicUrl: url,
        fetchFn: deps.fetchFn,
      });
      await updateFeishuStatus(deps.db, report.slug, "sent", null);
      return Response.json({ slug: report.slug, url, feishu: "sent" }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "飞书推送失败";
      await updateFeishuStatus(deps.db, report.slug, "failed", message);
      return Response.json({ slug: report.slug, url, feishu: "failed", error: message }, { status: 202 });
    }
  };
}
