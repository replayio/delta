import Dropdown from "./Dropdown";
import Image from "next/image";

import { ApproveButton } from "./ApproveButton";

export function Header({
  setBranch,
  branch,
  projectQuery,
  shownBranches,
  currentAction,
}) {
  return (
    <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
      <div className="flex items-center py-2 pl-4">
        <div style={{ transform: "rotate(-90deg)" }} className="mr-2">
          <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
        </div>
        <Dropdown
          onChange={(val) => setBranch(val)}
          selected={branch}
          project={projectQuery.data}
          options={shownBranches}
        />
      </div>
      <div className="flex">
        <ApproveButton
          branch={branch}
          projectQuery={projectQuery}
          currentAction={currentAction}
        />
      </div>
    </div>
  );
}
