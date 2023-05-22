import { useContext } from "react";
import { useImperativeCacheValue } from "suspense";
import { ContextMenuItem, useContextMenu } from "use-context-menu";
import { Branch, Project } from "../lib/types";
import { branchCache, branchesCache } from "../suspense/BranchCache";
import { projectCache } from "../suspense/ProjectCache";
import { mostRecentRunCache } from "../suspense/RunCache";
import Icon from "./Icon";
import { RunCount } from "./RunCount";
import { SessionContext } from "./SessionContext";

export function BranchDropDownMenu() {
  const { branchIdDeferred, isBranchPending, projectSlug } =
    useContext(SessionContext);

  const project = projectCache.read(projectSlug);
  const branches = branchesCache.read(project.id);
  const currentBranch =
    branchIdDeferred != null ? branchCache.read(branchIdDeferred) : null;

  const {
    contextMenu,
    onContextMenu: onClick,
    onKeyDown,
  } = useContextMenu(
    branches.map((branch) => (
      <BranchDropDownItem branch={branch} key={branch.id} project={project} />
    )),
    { alignTo: "auto-target" }
  );

  if (isBranchPending) {
    return (
      <div className="py-2 text-md opacity-50 cursor-default">Loading...</div>
    );
  }

  return (
    <>
      <div
        className="text-violet-500 py-2 text-md hover:underline focus:outline-none cursor-pointer"
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        {isBranchPending ? "Loading..." : currentBranch?.name ?? "-"}
      </div>
      {contextMenu}
    </>
  );
}

function BranchDropDownItem({
  branch,
  project,
}: {
  branch: Branch;
  project: Project;
}) {
  const { branchIdDefault: currentBranchId, transitionBranch } =
    useContext(SessionContext);

  const { value: run } = useImperativeCacheValue(mostRecentRunCache, branch.id);

  return (
    <ContextMenuItem
      dataTestState={currentBranchId === branch.id ? "selected" : undefined}
      onSelect={() => transitionBranch(branch.id)}
    >
      <div
        className={`h-full w-full ${
          branch.github_pr_status !== "open" ? "text-gray-400" : ""
        }`}
        title={`PR ${branch.github_pr_number} (${branch.github_pr_status})`}
      >
        <div className="flex flex-row gap-1 items-center w-full">
          {branch.github_pr_status === "closed" && (
            <div className="text-red-500">
              <Icon type="closed" />
            </div>
          )}
          {branch.github_pr_status === "merged" && (
            <div className="text-green-600">
              <Icon type="merged" />
            </div>
          )}
          {project.organization !== branch.organization && (
            <div className="text-violet-500" title={branch.organization}>
              <Icon type="fork" />
            </div>
          )}
          <div className="truncate grow">{branch.name}</div>
          {run && <RunCount runId={run.id} />}
        </div>
      </div>
    </ContextMenuItem>
  );
}
