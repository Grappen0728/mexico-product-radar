import type { MediaLink, RecommendationReport, SourceLink, Verdict } from "../recommendations/types";
import { assessEvidenceQuality } from "../recommendations/evidence-quality";
import type { DailyPlatformBrief, PlatformRecommendation } from "../daily-briefs/types";
import { calculateMonthlyRevenueUsd, formatUsdRange } from "../recommendations/monthly-revenue";

export interface StaticRenderOptions { basePath: string }

const verdictLabels: Record<Verdict, string> = {
  recommend: "推荐测试",
  watch: "继续观察",
  reject: "暂不建议",
};

export function normalizeBasePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

export function siteHref(basePath: string, path: string): string {
  const base = normalizeBasePath(basePath);
  return `${base}/${path.replace(/^\/+/, "")}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function price(report: RecommendationReport): string {
  return report.metrics.price === null ? "价格未公开" : `${escapeHtml(report.metrics.currency)} ${report.metrics.price}`;
}

function range(prefix: string, min: number | null, max: number | null): string {
  return min === null || max === null ? "未公开" : `${prefix} ${min}–${max}`;
}

function header(basePath: string): string {
  return `<header class="site-header"><a class="brand" href="${siteHref(basePath, "/")}"><span class="brand-mark">MX</span><span><strong>墨西哥选品雷达</strong><small>PRODUCT INTELLIGENCE</small></span></a><nav><a href="${siteHref(basePath, "/")}">今日推荐</a><a href="${siteHref(basePath, "/archive/")}">历史记录</a><a href="${siteHref(basePath, "/trends/")}">趋势看板</a></nav></header>`;
}

function shell(title: string, body: string, options: StaticRenderOptions, script = false): string {
  const scriptTag = script ? `<script src="${siteHref(options.basePath, "/assets/site.js")}" defer></script>` : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="每日一款面向墨西哥渠道的带电带芯片产品情报"><title>${escapeHtml(title)}｜墨西哥选品雷达</title><link rel="stylesheet" href="${siteHref(options.basePath, "/assets/styles.css")}">${scriptTag}</head><body>${header(options.basePath)}${body}<footer>每日公开资讯 · 数据不可核验时明确标注 · 不构成投资或采购承诺</footer></body></html>`;
}

function historyCard(report: RecommendationReport, basePath: string): string {
  const search = [report.product.zh, report.product.es, ...report.product.keywords, report.category].join(" ").toLowerCase();
  return `<a href="${siteHref(basePath, `/recommendations/${report.slug}/`)}" class="history-card" data-report-card data-search="${escapeHtml(search)}" data-platforms="${escapeHtml(report.platforms.join(" "))}" data-verdict="${report.verdict}" data-date="${escapeHtml(report.date)}"><span class="history-meta">${escapeHtml(report.date)} · ${escapeHtml(report.platforms.join(" / "))}</span><strong>${escapeHtml(report.product.zh)}</strong><span>${escapeHtml(report.product.es)}</span><div><b class="status status--${report.verdict}">${verdictLabels[report.verdict]}</b><span>${price(report)}</span></div></a>`;
}

function metric(label: string, value: string, accent = false): string {
  return `<div class="metric-card${accent ? " metric-card--accent" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

const confidenceLabels = { high: "高", medium: "中", low: "低" } as const;
const accessLabels = {
  available: "可访问",
  "login-restricted": "登录受限",
  blocked: "验证码/地区受限",
  invalid: "已失效",
  replaced: "已替代",
  unverified: "未验证",
} as const;

function evidenceSummary(report: RecommendationReport): string {
  const quality = assessEvidenceQuality(report);
  return `<div class="evidence-summary evidence-summary--${quality.confidence}"><div><span>数据可信度</span><strong>${confidenceLabels[quality.confidence]}</strong></div><div><span>证据覆盖</span><strong>${quality.coveragePercent}%</strong></div><div><span>有效来源</span><strong>${quality.usableSourceCount}</strong></div><div><span>墨西哥证据</span><strong>${quality.localEvidenceCount}</strong></div><small>最后核查：${escapeHtml(quality.lastCheckedAt ?? "暂无可核查时间")}</small></div>`;
}

function monthlyRevenueCard(report: RecommendationReport): string {
  const estimate = report.monthlyRevenueEstimate;
  const result = calculateMonthlyRevenueUsd(estimate);
  if (result.status === "unavailable" || !estimate || estimate.status !== "available") {
    const reason = result.status === "unavailable" ? result.reason : "暂无可靠估算";
    return `<section class="monthly-revenue-card monthly-revenue-card--unavailable"><span>单链接月销售额预估</span><strong>暂无可靠估算</strong><p>${escapeHtml(reason)}</p></section>`;
  }
  const fx = estimate.unitPriceCurrency === "USD" ? "原价为美元" : `1 USD = ${estimate.mxnPerUsd} MXN`;
  const fxLink = estimate.fxSourceUrl ? `<a href="${escapeHtml(estimate.fxSourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(estimate.fxPublisher)} · ${escapeHtml(estimate.fxCapturedAt)} ↗</a>` : "";
  return `<section class="monthly-revenue-card"><span>单链接月销售额预估</span><strong>${escapeHtml(formatUsdRange(result.revenueUsdMin, result.revenueUsdMax))}</strong><div class="monthly-revenue-grid"><small>周期：${escapeHtml(estimate.period)}</small><small>月销量：${escapeHtml(estimate.estimatedMonthlyUnitsMin)}–${escapeHtml(estimate.estimatedMonthlyUnitsMax)}</small><small>可信度：${confidenceLabels[estimate.confidence!]}</small><small>汇率：${escapeHtml(fx)}</small></div><p>${escapeHtml(estimate.method)}</p><div class="monthly-revenue-links"><a href="${escapeHtml(estimate.sourceProductUrl)}" target="_blank" rel="noreferrer">查看商品单链接 ↗</a>${fxLink}</div></section>`;
}

function sourceCard(source: SourceLink): string {
  const grade = source.grade ? `${source.grade}级` : "历史来源";
  const status = source.accessState ? accessLabels[source.accessState] : "状态未记录";
  const supports = source.supports?.length ? source.supports.join(" / ") : "不计入当前结论";
  return `<a class="source-card source-card--${source.accessState ?? "legacy"}" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><div><span class="source-badges"><b>${grade}</b><b>${status}</b><b>${escapeHtml(source.isEstimated ? "第三方估算" : source.grade === "A" ? "官方" : "参考/推断")}</b></span><strong>${escapeHtml(source.title)}</strong><span>${escapeHtml(source.note ?? "查看原始来源")}</span><small>${escapeHtml(source.publisher ?? "发布方未记录")} · 覆盖：${escapeHtml(supports)} · ${escapeHtml(source.geo ?? "地区未记录")}</small><small>最后核查：${escapeHtml(source.checkedAt ?? source.capturedAt)} ↗</small></div></a>`;
}

function mediaCard(item: MediaLink): string {
  const usable = item.accessState === "available" && item.direct === true;
  if (!usable) {
    const label = item.type === "video" ? "当前暂无可验证视频" : "当前暂无可验证图片";
    return `<div class="media-unavailable"><span class="media-icon">!</span><div><strong>${label}</strong><small>${escapeHtml(item.note ?? item.title)}</small></div></div>`;
  }
  const thumbnail = item.type === "image" && item.thumbnailUrl
    ? `<img src="${escapeHtml(item.thumbnailUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">`
    : `<span class="media-icon">${item.type === "video" ? "▶" : "▧"}</span>`;
  return `<a class="media-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${thumbnail}<div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note ?? "打开素材来源")}</small><small>${escapeHtml(item.sourceTitle ?? "来源未记录")} · 最后核查：${escapeHtml(item.checkedAt ?? "未记录")}</small></div><b>↗</b></a>`;
}

export function renderHome(reports: RecommendationReport[], options: StaticRenderOptions): string {
  const [report, ...history] = reports;
  if (!report) return shell("今日推荐", `<main class="shell"><div class="empty-state"><h1>暂无推荐</h1></div></main>`, options);
  const body = `<main class="shell"><article class="daily-brief"><div class="brief-heading"><div><span class="eyebrow">${escapeHtml(report.date)} · 今日推荐</span><h1>${escapeHtml(report.product.zh)}</h1><p>${escapeHtml(report.product.es)} · ${escapeHtml(report.product.keywords[0])}</p></div><span class="verdict verdict--${report.verdict}">${verdictLabels[report.verdict]}</span></div><div class="brief-grid"><div class="product-visual"><div class="printer"><div class="printer-paper">TODAY<br><span>● ● ●</span></div><div class="printer-face">• ᴗ •</div><div class="printer-slot"></div></div><span class="visual-label">PORTABLE · SMART · ELECTRONIC</span></div><div class="brief-data"><div class="metrics">${metric("墨西哥售价", price(report))}${metric("公开销量", report.metrics.sold === null ? "未公开" : `${report.metrics.sold}+`, true)}${metric("评分 / 评价", `${report.metrics.rating ?? "未公开"} / ${report.metrics.reviews ?? "未公开"}`)}</div><div class="decision-grid"><section><h2>为什么推荐</h2><ul>${report.reasons.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section><h2>主要风险</h2><ul>${report.risks.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section></div><div class="next-action"><strong>下一步</strong><span>${escapeHtml(report.nextAction)}</span></div></div></div><div class="signal-row">${report.platforms.map((item) => `<span>${item} 信号</span>`).join("")}<span class="trend-chip">${escapeHtml(report.trend.label)}</span><a href="${siteHref(options.basePath, `/recommendations/${report.slug}/`)}">查看完整数据与来源 →</a></div></article><section class="section-heading"><div><span class="eyebrow">ARCHIVE</span><h2>历史推荐</h2></div><a href="${siteHref(options.basePath, "/archive/")}">查看全部记录 →</a></section><div class="history-grid">${(history.length ? history : reports).slice(0, 3).map((item) => historyCard(item, options.basePath)).join("")}</div></main>`;
  return shell("今日推荐", body, options);
}

const channelLabels = {
  "tiktok-mx": "TikTok Shop Mexico",
  "temu-mx": "Temu Mexico",
  "mercado-libre-mx": "Mercado Libre Mexico",
} as const;

function stars(value: number): string { return `<span class="star-score">${"★".repeat(value)}${"☆".repeat(5 - value)}</span>`; }

function platformCard(item: PlatformRecommendation, options: StaticRenderOptions): string {
  const rows = [
    ["市场需求", item.scores.demand],
    ["竞争机会", item.scores.competitionOpportunity],
    ["利润空间", item.scores.profit],
    ["平台适配", item.scores.platformFit],
    [item.channel === "tiktok-mx" ? "视频传播" : item.channel === "temu-mx" ? "点击转化" : "销售潜力", item.scores.contentOrSalesPotential],
  ] as const;
  const playbookLabel = item.channel === "tiktok-mx" ? "短视频切入点" : item.channel === "temu-mx" ? "Temu商品打法" : "平台销售打法";
  return `<article class="platform-card"><div class="platform-card__heading"><span>${channelLabels[item.channel]}</span><b>${escapeHtml(item.report.trend.label)}</b></div><h3>${escapeHtml(item.report.product.zh)}</h3><p class="platform-card__subtitle">${escapeHtml(item.report.product.es)}</p><p>${escapeHtml(item.whyRecommended)}</p>${evidenceSummary(item.report)}<div class="score-list">${rows.map(([label, value]) => `<div><span>${label}</span>${stars(value)}</div>`).join("")}</div><div class="platform-playbook"><strong>${playbookLabel}</strong><ol>${item.platformPlaybook.slice(0, 3).map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ol></div><div class="commercial-grid"><div><span>采购成本</span><strong>${escapeHtml(item.commercialModel.purchaseCost)}</strong></div><div><span>建议售价</span><strong>${escapeHtml(item.commercialModel.suggestedPrice)}</strong></div><div><span>预估利润</span><strong>${escapeHtml(item.commercialModel.estimatedProfit)}</strong></div></div>${monthlyRevenueCard(item.report)}<p class="test-advice"><strong>测试建议：</strong>${escapeHtml(item.testAdvice)}</p><a href="${siteHref(options.basePath, `/recommendations/${item.report.slug}/`)}">查看产品完整数据与来源 →</a></article>`;
}

function dailyBriefSection(brief: DailyPlatformBrief, options: StaticRenderOptions, compact: boolean): string {
  const names = new Map(brief.recommendations.map((item) => [item.report.slug, item.report.product.zh]));
  const ranking = [...brief.ranking].sort((left, right) => left.rank - right.rank).map((item) => `<li><b>TOP ${item.rank}</b><span><strong>${escapeHtml(names.get(item.productSlug))}</strong>${escapeHtml(item.reason)}</span><em>${item.score}</em></li>`).join("");
  return `<section class="three-platform-brief"><div class="section-heading"><div><span class="eyebrow">THREE-CHANNEL BRIEF</span><h2>今日三平台推荐</h2></div>${compact ? `<a href="${siteHref(options.basePath, `/briefs/${brief.slug}/`)}">查看完整三平台日报 →</a>` : ""}</div><div class="platform-brief-grid">${brief.recommendations.map((item) => platformCard(item, options)).join("")}</div><section class="ranking-panel"><div><span class="eyebrow">TODAY'S RANKING</span><h2>今日三个产品排名</h2><ol>${ranking}</ol></div><aside><span>如果只能测试一个产品</span><h3>${escapeHtml(names.get(brief.priorityPick.productSlug))}</h3><p>${escapeHtml(brief.priorityPick.reason)}</p></aside></section></section>`;
}

export function renderDailyBriefHome(brief: DailyPlatformBrief, legacyReports: RecommendationReport[], options: StaticRenderOptions): string {
  const topSlug = brief.ranking.find((item) => item.rank === 1)?.productSlug;
  const top = brief.recommendations.find((item) => item.report.slug === topSlug)?.report ?? brief.recommendations[0].report;
  const html = renderHome([top, ...legacyReports.filter((item) => item.slug !== top.slug)], options);
  return html.replace('<section class="section-heading">', `${dailyBriefSection(brief, options, true)}<section class="section-heading">`);
}

export function renderDailyBriefPage(brief: DailyPlatformBrief, options: StaticRenderOptions): string {
  const analyses = brief.recommendations.map((item) => `<section class="panel platform-analysis"><h2>${escapeHtml(item.report.product.zh)}：详细分析</h2>${evidenceSummary(item.report)}<ol>${item.analysis.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ol><dl><div><dt>电池/供电</dt><dd>${escapeHtml(item.report.electronics.battery)}</dd></div><div><dt>充电规格</dt><dd>${escapeHtml(item.report.electronics.charging)}</dd></div><div><dt>芯片功能</dt><dd>${escapeHtml(item.report.electronics.chip)}</dd></div></dl><div class="source-list">${item.report.sources.map(sourceCard).join("")}</div></section>`).join("");
  const body = `<main class="shell detail-shell"><a href="${siteHref(options.basePath, "/")}" class="back-link">← 返回首页</a><div class="page-heading"><span class="eyebrow">${escapeHtml(brief.date)} · DAILY BRIEF</span><h1>墨西哥三平台选品简报</h1><p>三款不同的带电带芯片产品，按平台机会分别评估</p></div>${dailyBriefSection(brief, options, false)}${analyses}</main>`;
  return shell(`${brief.date} 三平台简报`, body, options);
}

export function renderArchive(reports: RecommendationReport[], options: StaticRenderOptions): string {
  const dates = [...new Set(reports.map((report) => report.date))].sort((left, right) => right.localeCompare(left));
  const dateOptions = dates.map((date) => `<option value="${escapeHtml(date)}">${escapeHtml(date)}</option>`).join("");
  const body = `<main class="shell"><div class="page-heading"><span class="eyebrow">ARCHIVE</span><h1>历史推荐</h1><p>按关键词、平台、结论和日期翻查每日公开记录</p></div><div class="filter-bar"><label class="search-field"><span>搜索</span><input id="archive-search" placeholder="中文、西语或英文关键词"></label><label><span>平台</span><select id="archive-platform"><option value="">全部平台</option><option>TK</option><option>MKD</option><option>TM</option></select></label><label><span>结论</span><select id="archive-verdict"><option value="">全部结论</option><option value="recommend">推荐</option><option value="watch">观察</option><option value="reject">不建议</option></select></label><label><span>简报日期</span><select id="archive-date"><option value="">全部日期</option>${dateOptions}</select></label></div><div class="archive-summary">找到 <strong id="archive-count">${reports.length}</strong> 条记录</div><div class="history-grid">${reports.map((item) => historyCard(item, options.basePath)).join("")}</div></main>`;
  return shell("历史推荐", body, options, true);
}

export function renderTrends(reports: RecommendationReport[], options: StaticRenderOptions): string {
  const counts = { TK: 0, AMZ: 0, MKD: 0, TM: 0 };
  for (const report of reports) for (const platform of report.platforms) counts[platform] += 1;
  const max = Math.max(1, ...Object.values(counts));
  const platforms = Object.entries(counts).map(([name, count]) => `<div><span>${name}</span><div><i style="width:${Math.round(count / max * 100)}%"></i></div><b>${count}</b></div>`).join("");
  const body = `<main class="shell"><div class="page-heading"><span class="eyebrow">TRENDS</span><h1>趋势看板</h1><p>基于已核验推荐记录的渠道信号概览</p></div><div class="metrics trend-metrics">${metric("累计推荐", String(reports.length))}${metric("爬升产品", String(reports.filter((item) => item.trend.status === "rising").length), true)}${metric("推荐测试", String(reports.filter((item) => item.verdict === "recommend").length))}${metric("覆盖平台", String(Object.values(counts).filter(Boolean).length))}</div><section class="panel"><h2>平台出现频次</h2><div class="platform-bars">${platforms}</div></section><section class="panel"><h2>近期关键词</h2><div class="tag-cloud">${reports.flatMap((item) => item.product.keywords).slice(0, 16).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section></main>`;
  return shell("趋势看板", body, options);
}

export function renderRecommendation(report: RecommendationReport, options: StaticRenderOptions): string {
  const evidence = report.trend.evidence.map((item) => `<a class="evidence" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(item.signal)}</strong><small>${escapeHtml(item.title)} · ${escapeHtml(item.capturedAt)} ↗</small></a>`).join("");
  const media = report.media.map(mediaCard).join("");
  const sources = report.sources.map(sourceCard).join("");
  const body = `<main class="shell detail-shell"><a href="${siteHref(options.basePath, "/archive/")}" class="back-link">← 返回历史记录</a><div class="page-heading"><span class="eyebrow">${escapeHtml(report.date)} · ${escapeHtml(report.platforms.join(" / "))}</span><h1>${escapeHtml(report.product.zh)}</h1><p>${escapeHtml(report.product.es)} · ${escapeHtml(report.product.keywords.join(" · "))}</p></div>${evidenceSummary(report)}${monthlyRevenueCard(report)}<div class="detail-grid"><section class="panel"><h2>趋势证据</h2>${evidence}</section><section class="panel"><h2>带电带芯片依据</h2><dl><div><dt>电池</dt><dd>${escapeHtml(report.electronics.battery)}</dd></div><div><dt>充电</dt><dd>${escapeHtml(report.electronics.charging)}</dd></div><div><dt>芯片</dt><dd>${escapeHtml(report.electronics.chip)}</dd></div></dl></section><section class="panel"><h2>推荐理由</h2><ol>${report.reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section><section class="panel"><h2>供应链与售价</h2><dl><div><dt>参考采购</dt><dd>${range("US$", report.supplyChain.purchaseUsdMin, report.supplyChain.purchaseUsdMax)}</dd></div><div><dt>建议零售</dt><dd>${range("MXN", report.supplyChain.retailMxnMin, report.supplyChain.retailMxnMax)}</dd></div></dl><p>${escapeHtml(report.supplyChain.logistics ?? "物流参数需向供应商复核")}</p></section><section class="panel panel--risk"><h2>主要风险</h2><ul>${report.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section class="panel panel--action"><h2>下一步</h2><p>${escapeHtml(report.nextAction)}</p></section></div><section class="detail-section"><div class="section-heading"><div><span class="eyebrow">MEDIA</span><h2>图片与视频</h2></div></div><div class="media-list">${media}</div></section><section class="detail-section"><div class="section-heading"><div><span class="eyebrow">SOURCES</span><h2>数据来源</h2></div></div><div class="source-list">${sources}</div></section></main>`;
  return shell(report.product.zh, body, options);
}
