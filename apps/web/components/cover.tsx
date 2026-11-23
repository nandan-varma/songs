import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverProps {
	src: string;
	alt: string;
	sizes: string;
	className?: string;
	priority?: boolean;
}

export function Cover({ src, alt, sizes, className, priority }: CoverProps) {
	return (
		<div
			className={cn(
				"relative aspect-square overflow-hidden rounded-md bg-muted",
				className,
			)}
		>
			{src && (
				<Image
					src={src}
					alt={alt}
					fill
					sizes={sizes}
					priority={priority}
					className="object-cover"
				/>
			)}
		</div>
	);
}
