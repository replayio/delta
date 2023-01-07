import { createCheck, createComment } from "../lib/github";
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

  it("create check", async () => {
    const { data } = await createCheck("replayio", "devtools", {
      head_sha: "8278ff37e846bb679f4f36da65acb8c6e78c9f28",
      title: "Tests are running",
      status: "in_progress",
      text: "",
      summary: "",
    });

    const check = omit(data, [
      "created_at",
      "html_url",
      "id",
      "app",
      "node_id",
      "started_at",
      "url",
      "check_suite",
      "output.annotations_url",
    ]);
    expect(check).toMatchSnapshot();
  });
});
