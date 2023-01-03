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
        <div className="mr-2">
          <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
        </div>
        <Dropdown
          selected={branch}
          project={projectQuery.data}
          options={shownBranches}
        />
      </div>
      <div className="flex items-center">
        <a
          _target="blank"
          href={`https://github.com/${projectQuery.data?.organization}/${projectQuery.data?.repository}/pull/${currentAction?.Branches?.pr_number}`}
          className="mr-4 fill-violet-400 hover:fill-violet-500 "
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 23 23"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clip-path="url(#clip0_127_18)">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.4657 0C5.12548 0 0 5.27083 0 11.7916C0 17.0039 3.28407 21.4161 7.83995 22.9777C8.40955 23.0951 8.61819 22.724 8.61819 22.4118C8.61819 22.1385 8.59942 21.2014 8.59942 20.2251C5.40993 20.9281 4.74574 18.8195 4.74574 18.8195C4.23317 17.4529 3.4737 17.1017 3.4737 17.1017C2.42979 16.3794 3.54974 16.3794 3.54974 16.3794C4.70772 16.4575 5.31535 17.5897 5.31535 17.5897C6.34026 19.3856 7.9918 18.8782 8.65621 18.5658C8.75103 17.8044 9.05496 17.2773 9.37766 16.9845C6.83382 16.7112 4.15737 15.6961 4.15737 11.1667C4.15737 9.87826 4.61267 8.82409 5.33412 8.00424C5.2203 7.71147 4.82155 6.50085 5.44818 4.88055C5.44818 4.88055 6.4163 4.56814 8.59918 6.09093C9.53376 5.83282 10.4976 5.70151 11.4657 5.70041C12.4338 5.70041 13.4207 5.83721 14.3321 6.09093C16.5152 4.56814 17.4833 4.88055 17.4833 4.88055C18.1099 6.50085 17.7109 7.71147 17.5971 8.00424C18.3376 8.82409 18.7741 9.87826 18.7741 11.1667C18.7741 15.6961 16.0977 16.6915 13.5348 16.9845C13.9526 17.3554 14.313 18.0581 14.313 19.171C14.313 20.7522 14.2943 22.0213 14.2943 22.4116C14.2943 22.724 14.5031 23.0951 15.0725 22.978C19.6284 21.4159 22.9125 17.0039 22.9125 11.7916C22.9312 5.27083 17.787 0 11.4657 0Z"
              />
            </g>
            <defs>
              <clipPath id="clip0_127_18">
                <rect width="23" height="23" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </a>
        <ApproveButton
          branch={branch}
          projectQuery={projectQuery}
          currentAction={currentAction}
        />
      </div>
    </div>
  );
}
