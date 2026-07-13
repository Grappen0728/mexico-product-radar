import Link from "next/link";
import type { DailyPlatformBrief } from "../lib/daily-briefs/types";
import { DailyRanking } from "./daily-ranking";
import { PlatformRecommendationCard } from "./platform-recommendation-card";

export function ThreePlatformBrief({ brief, compact = false }: { brief: DailyPlatformBrief; compact?: boolean }) {
  return <section className="three-platform-brief"><div className="section-heading"><div><span className="eyebrow">THREE-CHANNEL BRIEF</span><h2>今日三平台推荐</h2></div>{compact && <Link href={`/briefs/${brief.slug}`}>查看完整三平台日报 →</Link>}</div><div className="platform-brief-grid">{brief.recommendations.map((recommendation) => <PlatformRecommendationCard key={recommendation.channel} recommendation={recommendation} />)}</div><DailyRanking brief={brief} /></section>;
}
