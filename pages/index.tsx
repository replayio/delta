import Image from "next/image";
import Link from "next/link";
import { Suspense, useLayoutEffect } from "react";
import { Loader } from "../components/Loader";
import useDidMount from "../lib/hooks/useDidMount";
import { Project } from "../lib/server/supabase/supabase";
import { projectsCache } from "../suspense/ProjectCache";

export default function Home() {
  // TODO This is a hack because updateDehydratedSuspenseComponent() is throwing on the server.
  // Maybe proper Server components is the right way to go here?
  const didMount = useDidMount();
  if (!didMount) {
    return null;
  }

  return (
    <Suspense fallback={<Loader />}>
      <HomeSuspends />
    </Suspense>
  );
}

function HomeSuspends() {
  const projects = projectsCache.read();

  // Debug logging
  // if (process.env.NODE_ENV === "development") {
  //   console.groupCollapsed("<HomeSuspends>");
  //   console.log("projects:", projects);
  //   console.groupEnd();
  // }

  return <HomeWithData projects={projects} />;
}

function HomeWithData({ projects }: { projects: Project[] }) {
  useLayoutEffect(() => {
    if (projects.length === 1) {
      const project = projects[0];
      window.location.href = `/project/${project.short}`;
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
          <Link href={`/project/${project.short}`} key={project.id}>
            {project.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
