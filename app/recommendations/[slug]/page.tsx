import Link from "next/link";
import { MediaList } from "../../components/media-list";
import { MonthlyRevenueCard } from "../../components/monthly-revenue-card";
import { SiteHeader } from "../../components/site-header";
import { SourceList } from "../../components/source-list";
import { getReport } from "../../lib/recommendations/server";

export default async function RecommendationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = await getReport(slug);
  if (!report) return <><SiteHeader/><main className="shell"><div className="empty-state"><h1>没有找到这条推荐</h1><Link href="/archive">返回历史记录</Link></div></main></>;
  return <><SiteHeader/><main className="shell detail-shell">
    <Link href="/archive" className="back-link">← 返回历史记录</Link>
    <div className="page-heading"><span className="eyebrow">{report.date} · {report.platforms.join(" / ")}</span><h1>{report.product.zh}</h1><p>{report.product.es} · {report.product.keywords.join(" · ")}</p></div>
    <MonthlyRevenueCard report={report}/>
    <div className="detail-grid">
      <section className="panel"><h2>趋势证据</h2>{report.trend.evidence.map(item=><a className="evidence" key={item.url} href={item.url} target="_blank" rel="noreferrer"><strong>{item.signal}</strong><small>{item.title} · {item.capturedAt} ↗</small></a>)}</section>
      <section className="panel"><h2>带电带芯片依据</h2><dl><div><dt>电池</dt><dd>{report.electronics.battery}</dd></div><div><dt>充电</dt><dd>{report.electronics.charging}</dd></div><div><dt>芯片</dt><dd>{report.electronics.chip}</dd></div></dl></section>
      <section className="panel"><h2>推荐理由</h2><ol>{report.reasons.map(item=><li key={item}>{item}</li>)}</ol></section>
      <section className="panel"><h2>供应链与售价</h2><dl><div><dt>参考采购</dt><dd>US$ {report.supplyChain.purchaseUsdMin??"未公开"}–{report.supplyChain.purchaseUsdMax??"未公开"}</dd></div><div><dt>建议零售</dt><dd>MXN {report.supplyChain.retailMxnMin??"未公开"}–{report.supplyChain.retailMxnMax??"未公开"}</dd></div></dl><p>{report.supplyChain.logistics}</p></section>
      <section className="panel panel--risk"><h2>主要风险</h2><ul>{report.risks.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section className="panel panel--action"><h2>下一步</h2><p>{report.nextAction}</p></section>
    </div>
    <section className="detail-section"><div className="section-heading"><div><span className="eyebrow">MEDIA</span><h2>图片与视频</h2></div></div><MediaList media={report.media}/></section>
    <section className="detail-section"><div className="section-heading"><div><span className="eyebrow">SOURCES</span><h2>数据来源</h2></div></div><SourceList sources={report.sources}/></section>
  </main></>;
}
