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
	const [imageSrc, setImageSrc] = useState<string>(() => {
		// Start with lowest quality image or fallback
		return images?.[0]?.url || FALLBACK_URL;
	});
	const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(() => {
		return !images || images.length === 0;
	});
	const [hasError, setHasError] = useState(() => {
		return !images || images.length === 0;
	});

	useEffect(() => {
		if (!images || images.length === 0) {
			return;
		}

		let cancelled = false;

		// Test low quality image first
		const lowQualityUrl = images[0]?.url;
		if (!lowQualityUrl) {
			// Use a timeout to avoid setState in effect
			const timeout = setTimeout(() => {
				if (!cancelled) {
					setImageSrc(FALLBACK_URL);
					setHasError(true);
					setIsHighQualityLoaded(true);
				}
			}, 0);
			return () => {
				cancelled = true;
				clearTimeout(timeout);
			};
		}

		// Preload low quality to check if it works
		const lowImg = new window.Image();
		lowImg.src = lowQualityUrl;

		lowImg.onload = () => {
			if (cancelled) return;
			// Low quality loaded successfully, use it
			setImageSrc(lowQualityUrl);
			setHasError(false);
			setIsHighQualityLoaded(false);

			// Now try to load high quality image
			const highQualityIndex = images.length - 1;
			if (highQualityIndex > 0 && images[highQualityIndex]?.url) {
				const highImg = new window.Image();
				highImg.src = images[highQualityIndex].url;
				highImg.onload = () => {
					if (cancelled) return;
					setImageSrc(images[highQualityIndex].url);
					setIsHighQualityLoaded(true);
				};
				highImg.onerror = () => {
					if (cancelled) return;
					// High quality failed, but low quality is working
					console.warn(
						"Failed to load high quality image, staying with low quality",
					);
					setIsHighQualityLoaded(true);
				};
			} else {
				if (!cancelled) {
					setIsHighQualityLoaded(true);
				}
			}
		};

		lowImg.onerror = () => {
			if (cancelled) return;
			// Low quality failed, use fallback immediately
			console.warn("Failed to load image, using fallback");
			setImageSrc(FALLBACK_URL);
			setHasError(true);
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
