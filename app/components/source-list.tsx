import type { SourceLink } from "../lib/recommendations/types";

const accessLabels = {
  available: "可访问",
  "login-restricted": "登录受限",
  blocked: "验证码/地区受限",
  invalid: "已失效",
  replaced: "已替代",
  unverified: "未验证",
} as const;

export function SourceList({ sources }: { sources: SourceLink[] }) {
  return <div className="source-list">{sources.map((source) => <a className={`source-card source-card--${source.accessState ?? "legacy"}`} key={source.url} href={source.url} target="_blank" rel="noreferrer">
    <div>
      <span className="source-badges"><b>{source.grade ? `${source.grade}级` : "历史来源"}</b><b>{source.accessState ? accessLabels[source.accessState] : "状态未记录"}</b><b>{source.isEstimated ? "第三方估算" : source.grade === "A" ? "官方" : "参考/推断"}</b></span>
      <strong>{source.title}</strong>
      <span>{source.note ?? "查看原始来源"}</span>
      <small>{source.publisher ?? "发布方未记录"} · 覆盖：{source.supports?.join(" / ") || "不计入当前结论"} · {source.geo ?? "地区未记录"}</small>
      <small>最后核查：{source.checkedAt ?? source.capturedAt} ↗</small>
    </div>
  </a>)}</div>;
}
