"use client";

import { useMemo, useState } from "react";
import { filterRecommendations } from "../lib/recommendations/filter";
import type { RecommendationReport } from "../lib/recommendations/types";
import { HistoryCard } from "./history-card";

const PLATFORM_OPTIONS = ["TK", "MKD", "TM", "AMZ"] as const;

export function ArchiveFilters({ items }: { items: RecommendationReport[] }) {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [verdict, setVerdict] = useState("");
  const filtered = useMemo(
    () => filterRecommendations(items, { q, platform, verdict }),
    [items, q, platform, verdict],
  );
  const platformOptions = PLATFORM_OPTIONS.filter(
    (option) => option !== "AMZ" || items.some((item) => item.platforms.includes("AMZ")),
  );

  return (
    <>
      <div className="filter-bar">
        <label className="search-field">
          <span>搜索</span>
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="中文、西语或英文关键词" />
        </label>
        <label>
          <span>平台</span>
          <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="">全部平台</option>
            {platformOptions.map((option) => <option key={option}>{option === "AMZ" ? "AMZ（历史）" : option}</option>)}
          </select>
        </label>
        <label>
          <span>结论</span>
          <select value={verdict} onChange={(event) => setVerdict(event.target.value)}>
            <option value="">全部结论</option>
            <option value="recommend">推荐</option>
            <option value="watch">观察</option>
            <option value="reject">不建议</option>
          </select>
        </label>
      </div>
      <div className="archive-summary">找到 <strong>{filtered.length}</strong> 条记录</div>
      <div className="history-grid">
        {filtered.map((report) => <HistoryCard key={report.slug} report={report} />)}
      </div>
    </>
  );
}
