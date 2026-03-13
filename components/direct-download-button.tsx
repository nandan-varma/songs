"use client";

import { Download } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import type { DetailedSong } from "@/types/entity";
import { Button } from "./ui/button";

interface DirectDownloadButtonProps {
	song: DetailedSong;
	size?: "default" | "sm" | "lg" | "icon";
	variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
	className?: string;
	showLabel?: boolean;
}

function sanitizeFileName(fileName: string): string {
	return fileName
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, " ")
		.trim();
}

function getExtension(contentType: string | null, url: string): string {
	if (contentType) {
		if (contentType.includes("audio/mpeg")) return "mp3";
		if (contentType.includes("audio/mp4")) return "m4a";
		if (contentType.includes("audio/aac")) return "aac";
		if (contentType.includes("audio/ogg")) return "ogg";
	}

	const matches = url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
	if (matches?.[1]) {
		return matches[1].toLowerCase();
	}

	return "mp3";
}

export const DirectDownloadButton = memo(function DirectDownloadButton({
	song,
	size = "default",
	variant = "outline",
	className = "",
	showLabel = true,
}: DirectDownloadButtonProps) {
	const [isSaving, setIsSaving] = useState(false);

	const handleDirectDownload = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isSaving) return;

			const downloadTarget =
				song.downloadUrl.find((url) => url.quality === "320kbps") ||
				song.downloadUrl[song.downloadUrl.length - 1] ||
				song.downloadUrl[0];

			if (!downloadTarget?.url) {
				toast.error("No download URL available for this song");
				return;
			}

			setIsSaving(true);

			try {
				const response = await fetch(downloadTarget.url);
				if (!response.ok) {
					throw new Error(`Failed to download: ${response.status}`);
				}

				const blob = await response.blob();
				const extension = getExtension(
					response.headers.get("content-type"),
					downloadTarget.url,
				);
				const safeTitle = sanitizeFileName(song.name || "song");
				const fileName = `${safeTitle}.${extension}`;

				const objectUrl = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = objectUrl;
				link.download = fileName;
				link.rel = "noopener";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				window.setTimeout(() => {
					URL.revokeObjectURL(objectUrl);
				}, 1000);

				toast.success(`Saved to downloads: ${song.name}`);
			} catch {
				toast.error(`Failed to save ${song.name}`);
			} finally {
				setIsSaving(false);
			}
		},
		[song, isSaving],
	);

	return (
		<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
			<Button
				size={size}
				variant={variant}
				onClick={handleDirectDownload}
				disabled={isSaving}
				aria-label="Save song to device downloads"
				className={className}
			>
				<Download className="h-4 w-4" />
				{showLabel && (
					<span className="ml-2">{isSaving ? "Saving..." : "Save File"}</span>
				)}
			</Button>
		</motion.div>
	);
});
