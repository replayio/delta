import Dropdown from "./Dropdown";
import Image from "next/image";
import { Github } from "./SVGs";
import { ApproveButton } from "./ApproveButton";

export function Header({ branch, projectQuery, shownBranches, currentAction }) {
  return (
    <div className="flex text-black justify-between border-b-2 border-b-slate-100 ">
      <div className="flex items-center py-2 pl-4">
        <div className="mr-2">
          <Image
            className="fill-violet-500"
            width={16}
            height={16}
            src="/logo.svg"
            alt="Replay logo"
          />
        </div>
        <Dropdown
          selected={branch}
          project={projectQuery.data}
          options={shownBranches}
        />
      </div>
      <div className="flex items-center">
        {currentAction && (
          <a
            _target="blank"
            href={`https://github.com/${projectQuery.data?.organization}/${projectQuery.data?.repository}/pull/${currentAction?.Branches?.pr_number}`}
            className="mr-4 fill-violet-400 hover:fill-violet-500 "
          >
            <Github />
          </a>
        )}
        <ApproveButton
          branch={branch}
          projectQuery={projectQuery}
          currentAction={currentAction}
        />
      </div>
    </div>
  );
}
