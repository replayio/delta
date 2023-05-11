export type IconType =
  | "compare"
  | "delta"
  | "drag-handle"
  | "equal"
  | "expandable-closed"
  | "expandable-open"
  | "fork"
  | "image"
  | "image-off"
  | "slider";

export default function Icon({
  className = "fill-current h-4 w-4 grow-0 shrink-0",
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
    case "drag-handle":
      return "M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z";
    case "equal":
      return "M6,13H11V15H6M13,13H18V15H13M13,9H18V11H13M6,9H11V11H6M5,3C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5Z";
    case "expandable-closed":
      return "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";
    case "expandable-open":
      return "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";
    case "fork":
      return "M3,4V12.5L6,9.5L9,13C10,14 10,15 10,15V21H14V14C14,14 14,13 13.47,12C12.94,11 12,10 12,10L9,6.58L11.5,4M18,4L13.54,8.47L14,9C14,9 14.93,10 15.47,11C15.68,11.4 15.8,11.79 15.87,12.13L21,7";
    case "image":
      return "M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z";
    case "image-off":
      return "M22 20.7L3.3 2L2 3.3L3 4.3V19C3 20.1 3.9 21 5 21H19.7L20.7 22L22 20.7M5 19V6.3L12.6 13.9L11.1 15.8L9 13.1L6 17H15.7L17.7 19H5M8.8 5L6.8 3H19C20.1 3 21 3.9 21 5V17.2L19 15.2V5H8.8";
    case "slider":
      return "M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z";
  }
}
