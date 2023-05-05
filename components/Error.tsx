export default function Error({
  error,
  resetErrorBoundary,
}: {
  error: any;
  resetErrorBoundary: () => void;
}) {
  return (
    <pre className="px-2 py-1 bg-red-100 text-red-600">
      {error?.message ?? error ?? "Unknown error"}
    </pre>
  );
}
