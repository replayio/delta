import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import omit from "lodash/omit";

async function uploadImage(image, projectId, branch) {
  let res;

  try {
    res = await fetch("http://localhost:3000/api/uploadSnapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, projectId, branch }),
    });

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

describe("uploadSnapshot", () => {
  it("should upload a snapshot", async () => {
    const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";
    const branch = "visuals9";

    const file = "object-collapsed.png";

    const image = {
      content: fs.readFileSync(path.join(__dirname, `images/${file}`), {
        encoding: "base64",
      }),
      file: `./playwright/visuals/dark/${file}`,
    };

    const { data } = await uploadImage(image, projectId, branch);
    expect(omit(data, ["created_at", "id"])).toMatchSnapshot();
  });
});
