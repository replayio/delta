import { describe, it, expect } from "vitest";

import { toMatchImageSnapshot } from "jest-image-snapshot";
const dotenv = require("dotenv");
const fetch = require("node-fetch");
dotenv.config({ path: "./.env.local" });

expect.extend({ toMatchImageSnapshot });

async function get(path, body) {
  try {
    const res = await fetch(`http://localhost:3000/${path}`, {
      headers: {
        // "Content-Type": "con",
      },
    });

    if (res.status > 299) {
      return res.json();
    }

    return res.buffer();
  } catch (e) {
    console.error("error", e);
    return e;
  }
}

function snapshotDiff({ projectId, file, branch }) {
  return get(
    encodeURI(
      `api/snapshot-diff?projectId=${projectId}&file=${file}&branch=${branch}`
    )
  );
}

describe("snapshot-diff", () => {
  it("simple", async () => {
    const res = await snapshotDiff({
      projectId: "dcb5df26-b418-4fe2-9bdf-5a838e604ec4",
      file: "./playwright/visuals/dark/point-panel-invalid-conditional.png",
      branch: "visuals21",
    });

    expect(res).toMatchImageSnapshot();
  });

  it("diffent sizes", async () => {
    const res = await snapshotDiff({
      projectId: "dcb5df26-b418-4fe2-9bdf-5a838e604ec4",
      file: "./playwright/visuals/dark/log-point-message-with-yellow-badge.png",
      branch: "visuals9",
    });

    expect(res).toMatchImageSnapshot();
  });
});
