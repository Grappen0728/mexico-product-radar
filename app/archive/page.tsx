import type { Metadata } from "next";
import { ArchiveFilters } from "../components/archive-filters";
import { SiteHeader } from "../components/site-header";
import { getAllReports } from "../lib/recommendations/server";
export const metadata: Metadata = { title: "历史记录｜墨西哥选品雷达" };
export default async function ArchivePage(){const reports=await getAllReports();return <><SiteHeader/><main className="shell"><div className="page-heading"><span className="eyebrow">SEARCHABLE ARCHIVE</span><h1>历史推荐记录</h1><p>按关键词、平台与结论快速翻查每天的选品依据。</p></div><ArchiveFilters items={reports}/></main></>}
