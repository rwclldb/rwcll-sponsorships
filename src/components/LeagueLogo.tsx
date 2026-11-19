import Image from "next/image";

/** The RWCLL logo at a given width; height follows the image's proportions. */
export function LeagueLogo({ width, alt = "", priority }: { width: number; alt?: string; priority?: boolean }) {
  return (
    <Image
      src="/rwcll-logo.png"
      alt={alt}
      width={500}
      height={491}
      priority={priority}
      sizes={`${width}px`}
      style={{ width, height: "auto" }}
    />
  );
}
