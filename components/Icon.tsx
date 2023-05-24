export type IconType =
  | "arrow"
  | "closed"
  | "compare"
  | "delta"
  | "drag-handle"
  | "equal"
  | "expandable-closed"
  | "expandable-open"
  | "external"
  | "file"
  | "fork"
  | "image"
  | "image-off"
  | "merged"
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
    case "arrow":
      return "M8 5v14l11-7z";
    case "closed":
      return "M20 6.91L17.09 4L12 9.09L6.91 4L4 6.91L9.09 12L4 17.09L6.91 20L12 14.91L17.09 20L20 17.09L14.91 12L20 6.91Z";
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
    case "external":
      return "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z";
    case "file":
      return "M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6.12,15.5L9.86,19.24L11.28,17.83L8.95,15.5L11.28,13.17L9.86,11.76L6.12,15.5M17.28,15.5L13.54,11.76L12.12,13.17L14.45,15.5L12.12,17.83L13.54,19.24L17.28,15.5Z";
    case "fork":
      return "M3,4V12.5L6,9.5L9,13C10,14 10,15 10,15V21H14V14C14,14 14,13 13.47,12C12.94,11 12,10 12,10L9,6.58L11.5,4M18,4L13.54,8.47L14,9C14,9 14.93,10 15.47,11C15.68,11.4 15.8,11.79 15.87,12.13L21,7";
    case "image":
      return "M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z";
    case "image-off":
      return "M22 20.7L3.3 2L2 3.3L3 4.3V19C3 20.1 3.9 21 5 21H19.7L20.7 22L22 20.7M5 19V6.3L12.6 13.9L11.1 15.8L9 13.1L6 17H15.7L17.7 19H5M8.8 5L6.8 3H19C20.1 3 21 3.9 21 5V17.2L19 15.2V5H8.8";
    case "merged":
      return "M7,3A3,3 0 0,1 10,6C10,7.29 9.19,8.39 8.04,8.81C8.58,13.81 13.08,14.77 15.19,14.96C15.61,13.81 16.71,13 18,13A3,3 0 0,1 21,16A3,3 0 0,1 18,19C16.69,19 15.57,18.16 15.16,17C10.91,16.8 9.44,15.19 8,13.39V15.17C9.17,15.58 10,16.69 10,18A3,3 0 0,1 7,21A3,3 0 0,1 4,18C4,16.69 4.83,15.58 6,15.17V8.83C4.83,8.42 4,7.31 4,6A3,3 0 0,1 7,3M7,5A1,1 0 0,0 6,6A1,1 0 0,0 7,7A1,1 0 0,0 8,6A1,1 0 0,0 7,5M7,17A1,1 0 0,0 6,18A1,1 0 0,0 7,19A1,1 0 0,0 8,18A1,1 0 0,0 7,17M18,15A1,1 0 0,0 17,16A1,1 0 0,0 18,17A1,1 0 0,0 19,16A1,1 0 0,0 18,15Z";
    case "slider":
      return "M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z";
  }
}
