import Image from "next/image";

export default function Base64Image({
  base64String,
  className,
  height,
  title = "Image",
  width,
}: {
  base64String: string;
  className?: string;
  height: number;
  title?: string;
  width: number;
}) {
  return (
    <Image
      alt={title}
      className={className}
      height={height}
      src={base64StringToImageSource(base64String)}
      width={width}
    />
  );
}

export function base64StringToImageSource(base64String: string) {
  return `data:image/png;base64,${base64String}`;
}
