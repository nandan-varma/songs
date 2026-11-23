import type { ImageLink } from "@/lib/models";
import { cn } from "@/lib/utils";

interface CoverProps {
	src: ImageLink[];
	alt: string;
	sizes: string;
	className?: string;
	priority?: boolean;
}

const srcSet = (links: ImageLink[]) =>
	links
		.map(({ quality, url }) => `${url} ${Number.parseInt(quality, 10)}w`)
		.join(", ");

export function Cover({ src, alt, sizes, className, priority }: CoverProps) {
	return (
		<div
			className={cn(
				"relative aspect-square overflow-hidden rounded-md bg-muted",
				className,
			)}
		>
			{src.length > 0 && (
				<img
					src={src.at(-1)?.url}
					srcSet={srcSet(src)}
					sizes={sizes}
					alt={alt}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
					className="absolute inset-0 size-full object-cover"
				/>
			)}
		</div>
	);
}
