import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect } from "react";
import withRenderOnMount from "../components/withRenderOnMount";
import withSuspenseLoader from "../components/withSuspenseLoader";
import { projectsCache } from "../suspense/ProjectCache";

export default withRenderOnMount(withSuspenseLoader(Home));

function Home() {
  const projects = projectsCache.read();

  useLayoutEffect(() => {
    if (projects.length === 1) {
      const project = projects[0];
      window.location.href = `/project/${project.slug}`;
    }
  }, [projects]);

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
        {projects.map((project) => (
          <Link href={`/project/${project.slug}`} key={project.id}>
            {project.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
