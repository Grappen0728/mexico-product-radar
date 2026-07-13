import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    slug: text("slug").notNull(),
    productZh: text("product_zh").notNull(),
    productEs: text("product_es").notNull(),
    keywords: text("keywords").notNull(),
    category: text("category").notNull(),
    platforms: text("platforms").notNull(),
    price: real("price"),
    currency: text("currency").notNull().default("MXN"),
    trendStatus: text("trend_status").notNull(),
    verdict: text("verdict").notNull(),
    reportJson: text("report_json").notNull(),
    feishuStatus: text("feishu_status").notNull().default("pending"),
    feishuError: text("feishu_error"),
    feishuPushedAt: text("feishu_pushed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("recommendations_slug_unique").on(table.slug),
    uniqueIndex("recommendations_date_unique").on(table.date),
    index("recommendations_platforms_idx").on(table.platforms),
    index("recommendations_verdict_idx").on(table.verdict),
  ],
);
