import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public repository safety", () => {
  it("keeps private automation configuration and generated output out of Git", async () => {
    const ignore = await readFile(".gitignore", "utf8");
    expect(ignore).toContain(".env.automation");
    expect(ignore).toContain("dist-pages/");
  });
});
