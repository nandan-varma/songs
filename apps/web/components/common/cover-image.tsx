"use client";

import { Music } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Image as ImageType } from "@/types/entity";

interface CoverImageProps {
	/** API images, ordered smallest to largest. */
	images: ImageType[];
	alt: string;
	className?: string;
	priority?: boolean;
	fill?: boolean;
	width?: number;
	height?: number;
	rounded?: "none" | "default" | "full";
	objectFit?: "cover" | "contain";
	sizes?: string;
}

const ROUNDED = {
	none: "rounded-none",
	default: "rounded-md",
	full: "rounded-full",
} as const;

/** Artwork that falls back to a neutral music-note tile when there is no image or it fails to load. */
export function CoverImage({
	images,
	alt,
	className,
	priority = false,
	fill = true,
	width = 500,
	height = 500,
	rounded = "default",
	objectFit = "cover",
	sizes,
}: CoverImageProps) {
	const [failedUrl, setFailedUrl] = useState<string | null>(null);
	const src = images.at(-1)?.url;

	if (!src || src === failedUrl) {
		return (
			<div
				role="img"
				aria-label={alt}
				className={cn(
					"flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
					ROUNDED[rounded],
					className,
				)}
			>
				<Music className="h-1/3 w-1/3" />
			</div>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			{...(fill ? { fill: true, sizes } : { width, height })}
			priority={priority}
			onError={() => setFailedUrl(src)}
			className={cn(
				objectFit === "contain" ? "object-contain" : "object-cover",
				ROUNDED[rounded],
				className,
			)}
		/>
	);
}
