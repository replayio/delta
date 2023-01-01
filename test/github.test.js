import { createComment } from "../lib/github";
import { describe, it, expect } from "vitest";

describe("github", () => {
  it("create comment", async () => {
    const { data } = await createComment("replayio", "devtools", 8432);
    console.log(data.id);
  });
});
