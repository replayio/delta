import { createComment } from "../lib/github";
import { describe, it, expect } from "vitest";
import omit from "lodash/omit";

describe("github", () => {
  it("create comment", async () => {
    const { data } = await createComment("replayio", "devtools", 8432);

    expect(
      omit(data, [
        "created_at",
        "html_url",
        "id",
        "node_id",
        "updated_at",
        "url",
        "reactions",
      ])
    ).toMatchSnapshot();
  });
});
