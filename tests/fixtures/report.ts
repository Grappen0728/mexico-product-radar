import type { RecommendationReport } from "../../app/lib/recommendations/types";

export function makeReport(overrides: Partial<RecommendationReport> = {}): RecommendationReport {
  return {
    date: "2026-07-13",
    slug: "mini-thermal-printer",
    product: {
      zh: "迷你蓝牙热敏打印机",
      es: "Mini impresora térmica portátil Bluetooth",
      keywords: ["mini thermal printer", "impresora térmica"],
    },
    category: "便携打印设备",
    scenarios: ["学习笔记", "手账贴纸", "小商家标签"],
    audience: ["学生", "手账用户", "微型商家"],
    platforms: ["MKD", "TK", "TM"],
    metrics: {
      price: 278.91,
      currency: "MXN",
      sold: 5000,
      rating: 4.8,
      reviews: 947,
      discount: 47,
    },
    trend: {
      status: "hot",
      label: "稳定热卖",
      evidence: [
        {
          signal: "Mercado Libre 单链接累计销量超过 5,000 件",
          title: "Mercado Libre 商品页",
          url: "https://articulo.mercadolibre.com.mx/example",
          capturedAt: "2026-07-13",
        },
        {
          signal: "TikTok #miniprinter 仍有近期内容",
          title: "TikTok Creative Center",
          url: "https://ads.tiktok.com/business/creativecenter/example",
          capturedAt: "2026-07-13",
        },
      ],
    },
    reasons: ["公开销量验证充分", "短视频演示效果强"],
    supplyChain: {
      purchaseUsdMin: 5,
      purchaseUsdMax: 10,
      retailMxnMin: 349,
      retailMxnMax: 449,
      logistics: "锂电池运输需 UN38.3 与 MSDS",
    },
    electronics: {
      battery: "1000mAh 可充电锂电池",
      charging: "5V USB",
      chip: "蓝牙通信与热敏打印控制芯片",
    },
    risks: ["锂电运输", "App 稳定性", "低价竞争"],
    nextAction: "采购 5 至 10 台测试三个内容方向",
    verdict: "recommend",
    media: [
      {
        type: "image",
        title: "产品图片",
        url: "https://www.startech.com.bd/example",
      },
    ],
    sources: [
      {
        title: "Mercado Libre 商品页",
        url: "https://articulo.mercadolibre.com.mx/example",
        capturedAt: "2026-07-13",
      },
    ],
    ...overrides,
  };
}
