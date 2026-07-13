import type { RecommendationReport, TrendStatus, Verdict } from "./types";

export interface D1Result<T = unknown> {
  results?: T[];
  success?: boolean;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike;
}

interface RecommendationRow {
  date: string;
  slug: string;
  product_zh: string;
  product_es: string;
  keywords: string;
  category: string;
  platforms: string;
  price: number | null;
  currency: string;
  trend_status: TrendStatus;
  verdict: Verdict;
  report_json: string;
}

export interface RecommendationFilters {
  q?: string;
  platform?: string;
  verdict?: Verdict | string;
  trend?: TrendStatus | string;
}

function parseRow(row: RecommendationRow): RecommendationReport {
  return JSON.parse(row.report_json) as RecommendationReport;
}

export async function upsertRecommendation(db: D1DatabaseLike, report: RecommendationReport): Promise<void> {
  const sql = `
    INSERT INTO recommendations (
      date, slug, product_zh, product_es, keywords, category, platforms,
      price, currency, trend_status, verdict, report_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      slug = excluded.slug,
      product_zh = excluded.product_zh,
      product_es = excluded.product_es,
      keywords = excluded.keywords,
      category = excluded.category,
      platforms = excluded.platforms,
      price = excluded.price,
      currency = excluded.currency,
      trend_status = excluded.trend_status,
      verdict = excluded.verdict,
      report_json = excluded.report_json,
      feishu_status = 'pending',
      feishu_error = NULL,
      feishu_pushed_at = NULL
  `;
  await db.prepare(sql).bind(
    report.date,
    report.slug,
    report.product.zh,
    report.product.es,
    JSON.stringify(report.product.keywords),
    report.category,
    JSON.stringify(report.platforms),
    report.metrics.price,
    report.metrics.currency,
    report.trend.status,
    report.verdict,
    JSON.stringify(report),
  ).run();
}

export async function getRecommendation(db: D1DatabaseLike, slug: string): Promise<RecommendationReport | null> {
  const row = await db.prepare("SELECT * FROM recommendations WHERE slug = ? LIMIT 1").bind(slug).first<RecommendationRow>();
  return row ? parseRow(row) : null;
}

export async function getLatestRecommendation(db: D1DatabaseLike): Promise<RecommendationReport | null> {
  const row = await db.prepare("SELECT * FROM recommendations ORDER BY date DESC LIMIT 1").first<RecommendationRow>();
  return row ? parseRow(row) : null;
}

export async function listRecommendations(db: D1DatabaseLike, filters: RecommendationFilters): Promise<RecommendationReport[]> {
  const result = await db.prepare("SELECT * FROM recommendations ORDER BY date DESC").all<RecommendationRow>();
  const q = filters.q?.trim().toLocaleLowerCase();
  return (result.results ?? []).map(parseRow).filter((report) => {
    const text = [report.product.zh, report.product.es, ...report.product.keywords, report.category].join(" ").toLocaleLowerCase();
    return (!q || text.includes(q))
      && (!filters.platform || report.platforms.includes(filters.platform as never))
      && (!filters.verdict || report.verdict === filters.verdict)
      && (!filters.trend || report.trend.status === filters.trend);
  });
}

export async function updateFeishuStatus(
  db: D1DatabaseLike,
  slug: string,
  status: "sent" | "failed",
  error: string | null,
): Promise<void> {
  await db.prepare(`
    UPDATE recommendations
    SET feishu_status = ?, feishu_error = ?, feishu_pushed_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE feishu_pushed_at END
    WHERE slug = ?
  `).bind(status, error, status, slug).run();
}
