import Image from "next/image";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Home() {
  const projectsQuery = useSWR(encodeURI(`/api/getPublicProjects`), fetcher);
  console.log(projectsQuery.data);
  return (
    <div className={` h-full`}>
      <div className="flex text-black justify-between border-b-2 mb-1 border-b-slate-100 ">
        <div className="flex items-center py-2 pl-4">
          <div style={{ transform: "rotate(-90deg)" }}>
            <Image width={16} height={16} src="/logo.svg" alt="Replay logo" />
          </div>
          <h1 className="pl-2 text-lg">Delta</h1>
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
