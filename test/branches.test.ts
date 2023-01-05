import { describe, it, expect } from "vitest";
import orderBy from "lodash/orderBy";

import {
  getBranchFromProject,
  getBranchesFromProject,
} from "../lib/server/supabase/branches";

const projectId = "dcb5df26-b418-4fe2-9bdf-5a838e604ec4";

describe("branches", () => {
  it.only("gets the latest branch", async () => {
    const branchName = "visuals9";
    const branch = await getBranchFromProject(projectId, branchName);
    const branches = await getBranchesFromProject(projectId);
    const matchingBranches = orderBy(
      branches.data.filter((b) => b.name === branchName),
      "created_at",
      "desc"
    );

    expect(matchingBranches[0].id).toEqual(branch.data.id);
  });
});
