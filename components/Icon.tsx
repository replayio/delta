export type IconType =
  | "compare"
  | "delta"
  | "equal"
  | "image"
  | "image-off"
  | "slider";

export default function Icon({
  className = "fill-current h-4 w-4",
  type,
}: {
  className?: string;
  type: IconType;
}) {
  const pathData = getPathData(type);

  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d={pathData} />
    </svg>
  );
}

function getPathData(type: IconType): string {
  switch (type) {
    case "compare":
      return "M9 14H2V16H9V19L13 15L9 11V14M15 13V10H22V8H15V5L11 9L15 13Z";
    case "delta":
      return "M12,7.77L18.39,18H5.61L12,7.77M12,4L2,20H22";
    case "equal":
      return "M6,13H11V15H6M13,13H18V15H13M13,9H18V11H13M6,9H11V11H6M5,3C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5Z";
    case "image":
      return "M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z";
    case "image-off":
      return "M22 20.7L3.3 2L2 3.3L3 4.3V19C3 20.1 3.9 21 5 21H19.7L20.7 22L22 20.7M5 19V6.3L12.6 13.9L11.1 15.8L9 13.1L6 17H15.7L17.7 19H5M8.8 5L6.8 3H19C20.1 3 21 3.9 21 5V17.2L19 15.2V5H8.8";
    case "slider":
      return "M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z";
  }
}
