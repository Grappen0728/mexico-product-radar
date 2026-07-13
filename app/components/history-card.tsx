import Link from "next/link";
import type { RecommendationReport } from "../lib/recommendations/types";
const verdictLabels = { recommend: "推荐", watch: "观察", reject: "不建议" };
export function HistoryCard({ report }: { report: RecommendationReport }) { return <Link href={`/recommendations/${report.slug}`} className="history-card"><span className="history-meta">{report.date} · {report.platforms.join(" / ")}</span><strong>{report.product.zh}</strong><span>{report.product.es}</span><div><b className={`status status--${report.verdict}`}>{verdictLabels[report.verdict]}</b><span>{report.metrics.price === null ? "价格未公开" : `${report.metrics.currency} ${report.metrics.price}`}</span></div></Link>; }
