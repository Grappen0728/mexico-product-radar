import { env } from "cloudflare:workers";
import { createIngestionHandler } from "../../lib/ingestion";
import { listRecommendations, type D1DatabaseLike } from "../../lib/recommendations/repository";

type RuntimeEnv = {
  DB: D1DatabaseLike;
  INGEST_TOKEN?: string;
  FEISHU_WEBHOOK_URL?: string;
  FEISHU_SIGNING_SECRET?: string;
  PUBLIC_SITE_ORIGIN?: string;
};

function runtime(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const items = await listRecommendations(runtime().DB, {
      q: url.searchParams.get("q") ?? undefined,
      platform: url.searchParams.get("platform") ?? undefined,
      verdict: url.searchParams.get("verdict") ?? undefined,
      trend: url.searchParams.get("trend") ?? undefined,
    });
    return Response.json({ items });
  } catch (error) {
    return Response.json({ code: "DATABASE_ERROR", error: error instanceof Error ? error.message : "读取历史记录失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const values = runtime();
  if (!values.INGEST_TOKEN) {
    return Response.json({ code: "NOT_CONFIGURED", error: "写入服务尚未配置" }, { status: 503 });
  }
  return createIngestionHandler({
    db: values.DB,
    ingestToken: values.INGEST_TOKEN,
    publicOrigin: values.PUBLIC_SITE_ORIGIN,
    feishuWebhookUrl: values.FEISHU_WEBHOOK_URL,
    feishuSigningSecret: values.FEISHU_SIGNING_SECRET,
  })(request);
}
