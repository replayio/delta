import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import { fetchJSON } from "../utils/fetchJSON";

export default function Home() {
  const projectsQuery = useSWR(encodeURI(`/api/getPublicProjects`), fetchJSON);
  console.log(projectsQuery.data);
  return (
    <div className={` h-full`}>
      <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
        <div className="flex items-center py-2 pl-4">
          <div style={{}}>
            <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
          </div>
          <div className="pl-2  py-2 text-md font-normal text-slate-700">
            Delta
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        {projectsQuery.isLoading ? (
          <div>Loading...</div>
        ) : (
          projectsQuery.data?.map((project) => (
            <Link href={`/project/${project.short}`} key={project.id}>
              {project.name}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
