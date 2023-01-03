import { describe, it, expect } from "vitest";

import { downloadSnapshot } from "../lib/server/supabase/storage";
import { diffWithPrimaryBranch } from "../lib/server/diffWithPrimaryBranch";
import { getSnapshotFromBranch } from "../lib/server/supabase/snapshots";

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

describe("diffWithPrimaryBranch", () => {
  it("warning-stack-collapsed", async () => {
    const branchName = "visuals9";
    const path =
      "dcb5df26-b418-4fe2-9bdf-5a838e604ec4/d49ae04005a4695162f629ea9e4740446e2527fde2d6057807507c6e6c2e35cb.png";
    const downloadedSnapshot = await downloadSnapshot(path);
    const image = {
      content: downloadedSnapshot.data,
      file: "./playwright/visuals/light/warning-stack-collapsed.png",
    };

    const primaryDiff = await diffWithPrimaryBranch(
      projectId,
      branchName,
      image
    );

    console.log(primaryDiff);
  });

  it.only("./playwright/visuals/light/searchable-result-updated-after-filter.png", async () => {
    const file = "./playwright/visuals/light/warning-stack-collapsed.png";
    const branch = "visuals9";
    const snapshot = await getSnapshotFromBranch(file, projectId, branch);
    const downloadedSnapshot = await downloadSnapshot(snapshot.data.path);
    const image = {
      content: downloadedSnapshot.data,
      file,
    };
    const primaryDiff = await diffWithPrimaryBranch(projectId, branch, image);

    console.log(primaryDiff);
  });
});

// ./playwright/visuals/light/searchable-result-updated-after-filter.png
// iVBORw0KGg
