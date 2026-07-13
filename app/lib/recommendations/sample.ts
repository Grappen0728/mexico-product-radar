import type { RecommendationReport } from "./types";

export const SAMPLE_REPORT: RecommendationReport = {
  date: "2026-07-13",
  slug: "mini-thermal-printer-2026-07-13",
  product: { zh: "迷你蓝牙热敏打印机", es: "Mini impresora térmica portátil Bluetooth", keywords: ["mini thermal printer", "pocket printer", "impresora térmica"] },
  category: "便携打印设备",
  scenarios: ["学习笔记", "手账贴纸", "家庭收纳", "小商家标签"],
  audience: ["学生", "年轻女性", "手账用户", "微型商家"],
  platforms: ["MKD", "TK", "TM"],
  metrics: { price: 278.91, currency: "MXN", sold: 5000, rating: 4.8, reviews: 947, discount: 47 },
  trend: {
    status: "hot", label: "稳定热卖",
    evidence: [
      { signal: "Mercado Libre 单一商品公开显示超过 5,000 件已售、947 条评价，需求已经过市场验证。", title: "Mercado Libre 商品页", url: "https://articulo.mercadolibre.com.mx/MLM-2340759010-impresora-termica-pequena-inalambrica-con-bluetooth-_JM", capturedAt: "2026-07-13" },
      { signal: "TikTok Creative Center 的 #miniprinter 仍有近期内容与大量历史内容，适合视觉演示型投放。", title: "TikTok Creative Center", url: "https://ads.tiktok.com/business/creativecenter/hashtag/miniprinter/pc/en?countryCode=MX&period=7", capturedAt: "2026-07-13" },
    ],
  },
  reasons: ["“手机内容立即变成贴纸”的演示过程直观，适合短视频前三秒展示。", "学习、手账、家庭收纳与小生意四类场景可以共用一套产品素材。", "无墨打印容易表达低使用成本，热敏纸与贴纸卷还能形成耗材复购。", "Mercado Libre 已有公开销量验证，降低首轮测试的不确定性。"],
  supplyChain: { purchaseUsdMin: 5, purchaseUsdMax: 10, retailMxnMin: 349, retailMxnMax: 449, logistics: "建议用打印机＋3卷纸或10卷纸套装拉开价格带；锂电运输需准备 UN38.3、MSDS 与电芯资料。" },
  electronics: { battery: "常见规格为 1000–1200mAh 可充电锂电池", charging: "5V USB，部分型号仍使用 Micro USB", chip: "蓝牙通信芯片、热敏打印控制芯片与电机驱动电路" },
  risks: ["MXN 279 左右的裸机竞争激烈，需要通过耗材组合提高利润。", "App 的西班牙语适配、蓝牙连接稳定性与隐私权限需要实机测试。", "普通机型只能输出黑白热敏图像，不能宣传为真正的彩色照片打印。", "需验证打印头寿命、连续打印发热、充电口牢固度和耗材通用性。"],
  nextAction: "先采购 5–10 台样品，测试“学生错题贴＋手账照片＋小商家标签”三个内容方向。",
  verdict: "recommend",
  media: [
    { type: "image", title: "Mercado Libre 产品图片与买家展示", url: "https://articulo.mercadolibre.com.mx/MLM-2340759010-impresora-termica-pequena-inalambrica-con-bluetooth-_JM", note: "素材仅供选品参考，版权归原始发布者。" },
    { type: "video", title: "TikTok 热门相关视频列表", url: "https://ads.tiktok.com/business/creativecenter/hashtag/miniprinter/pc/en?countryCode=MX&period=7", note: "用于研究内容角度，不代表可直接商用。" },
  ],
  sources: [
    { title: "Mercado Libre 商品页", url: "https://articulo.mercadolibre.com.mx/MLM-2340759010-impresora-termica-pequena-inalambrica-con-bluetooth-_JM", capturedAt: "2026-07-13", note: "价格、销量、评分与评价数。" },
    { title: "TikTok Shop Mexico 同类商品", url: "https://shop.tiktok.com/mx/pdp/1733969391467529225", capturedAt: "2026-07-13", note: "墨西哥站销售场景与卖点。" },
    { title: "C9 技术规格参考", url: "https://manuals.plus/ae/1005007544973519", capturedAt: "2026-07-13", note: "电池容量与打印规格。" },
    { title: "供应端价格参考", url: "https://www.made-in-china.com/products-search/hot-china-products/Mini_Printer_Thermal.html", capturedAt: "2026-07-13", note: "批发价格区间仅用于采购询盘参考。" },
  ],
};
