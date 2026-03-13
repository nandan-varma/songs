"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getLargestImage, getSmallestImage } from "@/lib/utils/image";
import type { EntityType, Image as ImageType } from "@/types/entity";

interface ProgressiveImageProps {
	images: ImageType[];
	alt?: string;
	className?: string;
	entityType?: EntityType;
	priority?: boolean;
	fill?: boolean;
	width?: number;
	height?: number;
	rounded?: "none" | "default" | "full";
	objectFit?: "cover" | "contain";
}

const FALLBACK_URL = "https://placehold.co/500x500.webp?text=Image+Not+Found";
const BLUR_TIMEOUT = 1500; // ms to remove blur if high-quality doesn't load

// Component for progressive image loading with blur effect
export function ProgressiveImage({
	images,
	alt,
	priority = false,
	className,
	fill = true,
	width,
	height,
	rounded = "default",
	objectFit = "cover",
}: ProgressiveImageProps) {
	const [src, setSrc] = useState<string>(() => getSmallestImage(images));

	const [highLoaded, setHighLoaded] = useState(false);
	const [errored, setErrored] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	useEffect(() => {
		if (!images || images.length === 0) return;

		const targetUrl = getLargestImage(images);

		if (!targetUrl || targetUrl === FALLBACK_URL) return;

		timeoutRef.current = window.setTimeout(() => {
			setHighLoaded(true);
		}, BLUR_TIMEOUT);

		const img = new window.Image();
		img.src = targetUrl;
		img.onload = () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			setSrc(targetUrl);
			setHighLoaded(true);
		};
		img.onerror = () => {
			if (timeoutRef.current) {
				window.clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			setErrored(true);
			setSrc(FALLBACK_URL);
			setHighLoaded(true);
		};

		return () => {
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		};
	}, [images]);

	function handleError() {
		setErrored(true);
		setSrc(FALLBACK_URL);
	}

	// classes
	const objectClass =
		objectFit === "contain" ? "object-contain" : "object-cover";
	const roundedClass =
		rounded === "none"
			? "rounded-none"
			: rounded === "full"
				? "rounded-full"
				: "rounded-md";
	const blurClass =
		!highLoaded && !errored ? "blur-sm scale-105" : "blur-0 scale-100";

	const imageClassName = cn(
		"transition-all duration-300 ease-out",
		objectClass,
		roundedClass,
		blurClass,
		className,
	);

	const imageAlt = alt || "image";
	const imageSrc = src;

	return (
		<div className={cn(fill ? "relative w-full h-full" : undefined)}>
			<Image
				src={imageSrc}
				alt={imageAlt}
				width={fill ? undefined : width || 500}
				height={fill ? undefined : height || 500}
				{...(fill ? { fill: true } : {})}
				className={imageClassName}
				onError={handleError}
				priority={priority}
				// allow the native <img> to manage sizes when using fill
				style={fill ? { objectFit: objectFit } : undefined}
			/>
		</div>
	);
}
