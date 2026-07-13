import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    title: { default: "墨西哥选品雷达", template: "%s" },
    description: "每日追踪墨西哥 TK、Mercado Libre 与 Temu 的带电带芯片热卖选品。",
    openGraph: { title: "墨西哥选品雷达", description: "每日一款带电带芯片产品，保留价格、证据、风险和历史记录。", type: "website", locale: "zh_CN", images: [{ url: `${origin}/og.png`, width: 1734, height: 907, alt: "墨西哥选品雷达" }] },
    twitter: { card: "summary_large_image", title: "墨西哥选品雷达", description: "每日一款 · 数据有据 · 历史可查", images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="zh-CN"><body>{children}</body></html>; }
