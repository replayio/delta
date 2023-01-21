type Type = "compare" | "delta" | "slider";

export default function Icon({
  className = "fill-current h-4 w-4",
  type,
}: {
  className?: string;
  type: Type;
}) {
  const pathData = getPathData(type);

  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d={pathData} />
    </svg>
  );
}

function getPathData(type: Type): string {
  switch (type) {
    case "compare":
      return "M9 14H2V16H9V19L13 15L9 11V14M15 13V10H22V8H15V5L11 9L15 13Z";
    case "delta":
      return "M12,7.77L18.39,18H5.61L12,7.77M12,4L2,20H22";
    case "slider":
      return "M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z";
  }
}
