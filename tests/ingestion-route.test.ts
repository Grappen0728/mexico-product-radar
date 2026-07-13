import { describe, expect, it } from "vitest";
import { createIngestionHandler } from "../app/lib/ingestion";

describe("recommendation ingestion", () => {
  it("rejects requests without the bearer token", async () => {
    const POST = createIngestionHandler({
      db: { prepare: () => { throw new Error("database should not be called"); } },
      ingestToken: "secret-token",
      publicOrigin: "https://example.com",
    });
    const response = await POST(new Request("https://example.com/api/recommendations", {
      method: "POST",
      body: "{}",
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ code: "UNAUTHORIZED", error: "写入凭证无效" });
  });
});
