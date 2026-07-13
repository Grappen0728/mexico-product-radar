import Link from "next/link";
import { DailyBrief } from "./components/daily-brief";
import { HistoryCard } from "./components/history-card";
import { SiteHeader } from "./components/site-header";
import { ThreePlatformBrief } from "./components/three-platform-brief";
import { getLatestDailyBrief } from "./lib/daily-briefs/server";
import { getAllReports } from "./lib/recommendations/server";

export default async function Home() {
  const [reports, dailyBrief] = await Promise.all([getAllReports(), getLatestDailyBrief()]); const [latest, ...history] = reports;
  const topSlug = dailyBrief?.ranking.find((item) => item.rank === 1)?.productSlug;
  const hero = dailyBrief?.recommendations.find((item) => item.report.slug === topSlug)?.report ?? latest;
  return <><SiteHeader /><main className="shell"><DailyBrief report={hero} />{dailyBrief && <ThreePlatformBrief brief={dailyBrief} compact />}<section className="section-heading"><div><span className="eyebrow">ARCHIVE</span><h2>历史推荐</h2></div><Link href="/archive">查看全部记录 →</Link></section><div className="history-grid">{(history.length ? history : reports).slice(0, 3).map((report) => <HistoryCard key={report.slug} report={report} />)}</div></main><footer>每日公开资讯 · 数据不可核验时明确标注 · 不构成投资或采购承诺</footer></>;
}
