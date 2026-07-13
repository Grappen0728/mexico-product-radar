import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DailyBrief } from "../app/components/daily-brief";
import { makeReport } from "./fixtures/report";

describe("DailyBrief", () => {
  it("renders the latest product as the page headline", () => {
    const html = renderToStaticMarkup(<DailyBrief report={makeReport()} />);
    expect(html).toContain("迷你蓝牙热敏打印机");
    expect(html).toContain("MXN");
    expect(html).toContain("为什么推荐");
    expect(html).toContain("主要风险");
  });
});
