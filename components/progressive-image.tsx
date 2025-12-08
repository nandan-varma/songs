"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { EntityType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
	images: Array<{ url: string; quality: string }>;
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
	const [imageSrc, setImageSrc] = useState<string>(
		() => images?.[0]?.url || FALLBACK_URL,
	);
	const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(
		() => !images || images.length === 0,
	);
	const [hasError, setHasError] = useState(
		() => !images || images.length === 0,
	);

	useEffect(() => {
		if (!images || images.length === 0) {
			setImageSrc(FALLBACK_URL);
			setHasError(true);
			setIsHighQualityLoaded(true);
			return;
		}

		let cancelled = false;
		const lowQualityUrl = images[0]?.url;
		const highQualityIndex = images.length - 1;
		const highQualityUrl = images[highQualityIndex]?.url;

		// Start loading both images in parallel
		const lowImg = new window.Image();
		const highImg = new window.Image();

		lowImg.src = lowQualityUrl;
		highImg.src = highQualityUrl;

		lowImg.onload = () => {
			if (cancelled) return;
			setImageSrc((prev) => (prev !== lowQualityUrl ? lowQualityUrl : prev));
			setHasError(false);
			setIsHighQualityLoaded(false);
		};

		lowImg.onerror = () => {
			if (cancelled) return;
			console.warn("Failed to load image, using fallback");
			setImageSrc(FALLBACK_URL);
			setHasError(true);
			setIsHighQualityLoaded(true);
		};

		highImg.onload = () => {
			if (cancelled) return;
			setImageSrc((prev) => (prev !== highQualityUrl ? highQualityUrl : prev));
			setIsHighQualityLoaded(true);
		};

		highImg.onerror = () => {
			if (cancelled) return;
			console.warn(
				"Failed to load high quality image, staying with low quality",
			);
			setIsHighQualityLoaded(true);
		};

		return () => {
			cancelled = true;
		};
	}, [images]);

	const handleError = () => {
		// Fallback in case Next.js Image onError is triggered
		if (!hasError && imageSrc !== FALLBACK_URL) {
			console.warn("Image error detected, switching to fallback");
			setHasError(true);
			setImageSrc(FALLBACK_URL);
			setIsHighQualityLoaded(true);
		}
	};

	const roundedClasses = {
		none: "",
		default: "rounded",
		full: "rounded-full",
	};

	const imageClassName = cn(
		objectFit === "cover" ? "object-cover" : "object-contain",
		"transition-opacity duration-300",
		!isHighQualityLoaded && "blur-sm",
		isHighQualityLoaded && "blur-0",
		roundedClasses[rounded],
		className,
	);

	const wrapperClassName = cn(
		"overflow-hidden bg-muted",
		roundedClasses[rounded],
	);

	const imageAlt = hasError ? "Image not found" : alt || "Image";

	if (fill) {
		return (
			<Image
				src={imageSrc}
				alt={imageAlt}
				fill
				className={imageClassName}
				onError={handleError}
				priority={priority}
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
			/>
		);
	}

	return (
		<div className={wrapperClassName}>
			<Image
				src={imageSrc}
				alt={imageAlt}
				width={width || 500}
				height={height || 500}
				className={imageClassName}
				onError={handleError}
				priority={priority}
			/>
		</div>
	);
}
