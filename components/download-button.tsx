"use client";

import { Check, Download } from "lucide-react";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useDownloadsActions } from "@/contexts/downloads-context";
import type { DetailedSong } from "@/lib/types";
import { Button } from "./ui/button";

interface DownloadButtonProps {
	song: DetailedSong;
	size?: "default" | "sm" | "lg" | "icon";
	variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
	className?: string;
	showLabel?: boolean;
}

export const DownloadButton = memo(function DownloadButton({
	song,
	size = "icon",
	variant = "ghost",
	className = "",
	showLabel = false,
}: DownloadButtonProps) {
	const { downloadSong, isSongCached } = useDownloadsActions();

	const isDownloaded = isSongCached(song.id);

	const handleDownload = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isDownloaded) {
				toast.info("Song is already downloaded");
				return;
			}

			await downloadSong(song);
			toast.success(`Downloaded: ${song.name}`);
		},
		[song, downloadSong, isDownloaded],
	);

	const getIcon = () => {
		if (isDownloaded) {
			return <Check className="h-4 w-4" />;
		}
		return <Download className="h-4 w-4" />;
	};

	const getAriaLabel = () => {
		if (isDownloaded) {
			return "Already downloaded";
		}
		return "Download song";
	};

	const getButtonClassName = () => {
		const baseClass = className;
		if (isDownloaded) {
			return `${baseClass} text-green-600 hover:text-green-700`;
		}
		return baseClass;
	};

	return (
		<Button
			size={size}
			variant={variant}
			onClick={handleDownload}
			disabled={isDownloaded}
			aria-label={getAriaLabel()}
			className={getButtonClassName()}
		>
			{getIcon()}
			{showLabel && (
				<span className="ml-2">{isDownloaded ? "Downloaded" : "Download"}</span>
			)}
		</Button>
	);
});
