import { ComponentType, Suspense } from "react";
import { Loader } from "./Loader";

export default function withSuspenseLoader<Props extends Object>(
  Component: ComponentType<Props>
): ComponentType<Props> {
  function WrappedComponent(props: Props) {
    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    );
  }

  // Format for display in DevTools
  const name = Component.displayName || Component.name || "Unknown";
  WrappedComponent.displayName = `withSuspenseLoader(${name})`;

  return WrappedComponent;
}
