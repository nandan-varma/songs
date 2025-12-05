"use client";

import { Check, Clock, Download } from "lucide-react";
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
	const { addToDownloadQueue, isSongCached, isSongInQueue } =
		useDownloadsActions();

	const isDownloaded = isSongCached(song.id);
	const isInDownloadQueue = isSongInQueue(song.id);

	const handleDownload = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isDownloaded) {
				toast.info("Song is already downloaded");
				return;
			}

			if (isInDownloadQueue) {
				toast.info("Song is already in download queue");
				return;
			}

			addToDownloadQueue(song);
			toast.success(`Added to download queue: ${song.name}`);
		},
		[song, addToDownloadQueue, isDownloaded, isInDownloadQueue],
	);

	const getIcon = () => {
		if (isDownloaded) {
			return <Check className="h-4 w-4" />;
		}
		if (isInDownloadQueue) {
			return <Clock className="h-4 w-4" />;
		}
		return <Download className="h-4 w-4" />;
	};

	const getAriaLabel = () => {
		if (isDownloaded) {
			return "Already downloaded";
		}
		if (isInDownloadQueue) {
			return "In download queue";
		}
		return "Download song";
	};

	const getButtonClassName = () => {
		const baseClass = className;
		if (isDownloaded) {
			return `${baseClass} text-green-600 hover:text-green-700`;
		}
		if (isInDownloadQueue) {
			return `${baseClass} text-blue-600 hover:text-blue-700`;
		}
		return baseClass;
	};

	return (
		<Button
			size={size}
			variant={variant}
			onClick={handleDownload}
			disabled={isDownloaded || isInDownloadQueue}
			aria-label={getAriaLabel()}
			className={getButtonClassName()}
		>
			{getIcon()}
			{showLabel && (
				<span className="ml-2">
					{isDownloaded
						? "Downloaded"
						: isInDownloadQueue
							? "In Queue"
							: "Download"}
				</span>
			)}
		</Button>
	);
});
