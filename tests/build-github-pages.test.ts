import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildGitHubPages } from "../scripts/build-github-pages";

describe("GitHub Pages build", () => {
  it("writes the home, archive, trends, detail, assets, and 404 pages", async () => {
    const output = await mkdtemp(join(tmpdir(), "mx-radar-pages-"));
    const files = await buildGitHubPages(process.cwd(), output, "/mexico-product-radar");
    expect(files).toContain("index.html");
    expect(files).toContain("archive/index.html");
    expect(files).toContain("trends/index.html");
    expect(files).toContain("recommendations/mini-thermal-printer-2026-07-13/index.html");
    expect(files).toContain("assets/styles.css");
    expect(await readFile(join(output, ".nojekyll"), "utf8")).toBe("");
  });
});
