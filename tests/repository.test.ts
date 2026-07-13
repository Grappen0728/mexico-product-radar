import { describe, expect, it } from "vitest";
import {
  getRecommendation,
  listRecommendations,
  upsertRecommendation,
  type D1DatabaseLike,
} from "../app/lib/recommendations/repository";
import { makeReport } from "./fixtures/report";

class FakeD1 implements D1DatabaseLike {
  records = new Map<string, Record<string, unknown>>();

  prepare(sql: string) {
    let values: unknown[] = [];
    return {
      bind: (...bound: unknown[]) => {
        values = bound;
        return this.prepareBound(sql, () => values);
      },
      first: async () => null,
      all: async <T>() => ({ results: [...this.records.values()] as T[] }),
      run: async () => ({ success: true }),
    };
  }

  private prepareBound(sql: string, values: () => unknown[]) {
    return {
      bind: (...bound: unknown[]) => this.prepare(sql).bind(...bound),
      first: async <T>() => {
        const [key] = values();
        return (this.records.get(String(key)) as T | undefined) ?? null;
      },
      all: async <T>() => ({ results: [...this.records.values()] as T[] }),
      run: async () => {
        if (sql.includes("INSERT INTO recommendations")) {
          const [date, slug, productZh, productEs, keywords, category, platforms, price, currency, trendStatus, verdict, reportJson] = values();
          this.records.set(String(slug), {
            date, slug, product_zh: productZh, product_es: productEs, keywords, category,
            platforms, price, currency, trend_status: trendStatus, verdict, report_json: reportJson,
          });
        }
        return { success: true };
      },
    };
  }
}

describe("recommendation repository", () => {
  it("updates an existing slug instead of duplicating it", async () => {
    const db = new FakeD1();
    await upsertRecommendation(db, makeReport());
    await upsertRecommendation(db, makeReport({ metrics: { ...makeReport().metrics, price: 299 } }));

    expect(db.records.size).toBe(1);
    expect((await getRecommendation(db, "mini-thermal-printer"))?.metrics.price).toBe(299);
    expect(await listRecommendations(db, {})).toHaveLength(1);
  });
});
