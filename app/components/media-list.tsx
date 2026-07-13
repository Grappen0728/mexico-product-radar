import type { MediaLink } from "../lib/recommendations/types";

export function MediaList({ media }: { media: MediaLink[] }) {
  return <div className="media-list">{media.map((item) => {
    const usable = item.accessState === "available" && item.direct === true;
    if (!usable) return <div className="media-unavailable" key={item.url}><span className="media-icon">!</span><div><strong>{item.type === "video" ? "当前暂无可验证视频" : "当前暂无可验证图片"}</strong><small>{item.note ?? item.title}</small></div></div>;
    return <a className="media-card" key={item.url} href={item.url} target="_blank" rel="noreferrer">
      {item.type === "image" && item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} loading="lazy" /> : <span className="media-icon">{item.type === "video" ? "▶" : "▧"}</span>}
      <div><strong>{item.title}</strong><small>{item.note ?? "打开素材来源"}</small><small>{item.sourceTitle ?? "来源未记录"} · 最后核查：{item.checkedAt ?? "未记录"}</small></div><b>↗</b>
    </a>;
  })}</div>;
}
