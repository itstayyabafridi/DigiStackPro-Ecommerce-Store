import Image from "next/image";
// Direct delivery keeps private signed URLs out of the shared image optimizer cache.
// Intrinsic dimensions reserve space; uploaded thumbnails are cropped by their parent.
export function AssetImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={className}
      unoptimized
    />
  );
}
