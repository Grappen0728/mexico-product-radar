import Link from "next/link";
import { DailyBrief } from "./components/daily-brief";
import { HistoryCard } from "./components/history-card";
import { SiteHeader } from "./components/site-header";
import { getAllReports } from "./lib/recommendations/server";

export default async function Home() {
  const reports = await getAllReports(); const [latest,...history]=reports;
  return <><SiteHeader/><main className="shell"><DailyBrief report={latest}/><section className="section-heading"><div><span className="eyebrow">ARCHIVE</span><h2>历史推荐</h2></div><Link href="/archive">查看全部记录 →</Link></section><div className="history-grid">{(history.length?history:reports).slice(0,3).map((report)=><HistoryCard key={report.slug} report={report}/>)}</div></main><footer>每日公开资讯 · 数据不可核验时明确标注 · 不构成投资或采购承诺</footer></>;
}
