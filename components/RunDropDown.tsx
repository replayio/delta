import moment from "moment";
import { useContext } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";
import { Run } from "../lib/types";
import { runsCache } from "../suspense/RunCache";
import { RunCount } from "./RunCount";
import { SessionContext } from "./SessionContext";

export function RunDropDownMenu() {
  const { branchIdDeferred, isRunPending, runIdDeferred } =
    useContext(SessionContext);

  const runs = branchIdDeferred != null ? runsCache.read(branchIdDeferred) : [];
  const currentRun = runIdDeferred
    ? runs.find((run) => run.id === runIdDeferred)
    : null;

  const {
    contextMenu,
    onContextMenu: onClick,
    onKeyDown,
  } = useContextMenu(
    runs.map((run) => <RunDropDownItem key={run.id} run={run} />),
    { alignTo: "auto-target" }
  );

  if (isRunPending) {
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
        {isRunPending
          ? "Loading..."
          : currentRun
          ? relativeTime(currentRun.created_at)
          : "–"}
      </div>
      {contextMenu}
    </>
  );
}

function RunDropDownItem({ run }: { run: Run }) {
  const { runIdDefault: currentRunId, transitionRun } =
    useContext(SessionContext);

  return (
    <ContextMenuItem
      dataTestState={currentRunId === run.id ? "selected" : undefined}
      onSelect={() => transitionRun(run.id)}
    >
      <div className="h-full w-full">
        <div className="flex w-full gap-1 items-center">
          <div className="truncate grow">{relativeTime(run.created_at)}</div>
          <RunCount runId={run.id} />
        </div>
      </div>
    </ContextMenuItem>
  );
}

// Transform a date into a relative time from now, e.g. 2 days ago
function relativeTime(date) {
  return moment(date).fromNow();
}
