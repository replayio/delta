import { ComponentType, Suspense } from "react";
import useDidMount from "../lib/hooks/useDidMount";
import { Loader } from "./Loader";

export default function withRenderOnMount<Props extends Object>(
  Component: ComponentType<Props>
): ComponentType<Props> {
  function WrappedComponent(props: Props) {
    // HACK updateDehydratedSuspenseComponent() throws when rendered on the server
    // We could use getServerSideProps() and change our data loading strategy to not use Suspense
    // but for now we will just not render on the server.
    const didMount = useDidMount();
    if (!didMount) {
      return null;
    }

    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    );
  }

  // Format for display in DevTools
  const name = Component.displayName || Component.name || "Unknown";
  WrappedComponent.displayName = `withRenderOnMount(${name})`;

  return WrappedComponent;
}
