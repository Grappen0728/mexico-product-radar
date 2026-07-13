import { env } from "cloudflare:workers";
import { getRecommendation, type D1DatabaseLike } from "../../../lib/recommendations/repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const runtime = env as unknown as { DB: D1DatabaseLike };
    const report = await getRecommendation(runtime.DB, slug);
    if (!report) return Response.json({ code: "NOT_FOUND", error: "没有找到这条推荐" }, { status: 404 });
    return Response.json({ report });
  } catch (error) {
    return Response.json({ code: "DATABASE_ERROR", error: error instanceof Error ? error.message : "读取推荐失败" }, { status: 500 });
  }
}
