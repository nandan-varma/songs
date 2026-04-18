"use client";

import { Share2 } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
	title: string;
	type: "album" | "playlist" | "artist" | "song";
	id: string;
	className?: string;
}

export const ShareButton = memo(function ShareButton({
	title,
	type,
	id,
	className = "",
}: ShareButtonProps) {
	const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${type}?id=${id}`;

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: title,
					text: `Check out ${title} on Songs`,
					url: shareUrl,
				});
			} catch {
				// User cancelled or share failed
			}
		} else {
			try {
				await navigator.clipboard.writeText(shareUrl);
				toast.success("Link copied to clipboard");
			} catch {
				toast.error("Failed to copy link");
			}
		}
	};

	return (
		<motion.div
			whileHover={{ scale: 1.1 }}
			whileTap={{ scale: 0.95 }}
			className={className}
		>
			<button
				type="button"
				onClick={handleShare}
				className="flex items-center justify-center rounded-full p-2 hover:bg-accent/50 transition-colors"
				aria-label={`Share ${title}`}
			>
				<Share2 className="h-4 w-4" />
			</button>
		</motion.div>
	);
});
