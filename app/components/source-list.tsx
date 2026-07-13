import type { SourceLink } from "../lib/recommendations/types";
export function SourceList({ sources }: { sources: SourceLink[] }) { return <div className="source-list">{sources.map((source)=><a key={source.url} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.note ?? "查看原始来源"}</span><small>查询日期：{source.capturedAt} ↗</small></a>)}</div>; }
