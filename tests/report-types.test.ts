import { describe, expect, it } from "vitest";
import { isPlatform } from "../app/lib/recommendations/types";
import type { RecommendationReport } from "../app/lib/recommendations/types";

describe("RecommendationReport", () => {
  it("represents a sourced bilingual recommendation", () => {
    const report: RecommendationReport = {
      date: "2026-07-13",
      slug: "mini-thermal-printer",
      product: {
        zh: "迷你蓝牙热敏打印机",
        es: "Mini impresora térmica",
        keywords: ["mini thermal printer"],
      },
      category: "便携打印设备",
      scenarios: ["学习笔记"],
      audience: ["学生"],
      platforms: ["MKD", "TK"],
      metrics: {
        price: 278.91,
        currency: "MXN",
        sold: 5000,
        rating: 4.8,
        reviews: 947,
        discount: 47,
      },
      trend: { status: "hot", label: "稳定热卖", evidence: [] },
      reasons: ["已有公开销量验证"],
      supplyChain: {
        purchaseUsdMin: 5,
        purchaseUsdMax: 10,
        retailMxnMin: 349,
        retailMxnMax: 449,
      },
      electronics: {
        battery: "1000mAh rechargeable lithium",
        charging: "5V USB",
        chip: "Bluetooth and thermal-print controller",
      },
      risks: ["锂电运输"],
      nextAction: "采购5至10台测试",
      verdict: "recommend",
      media: [],
      sources: [],
    };

    expect(report.platforms).toContain("MKD");
    expect(isPlatform("TM")).toBe(true);
    expect(isPlatform("Amazon")).toBe(false);
  });
});
