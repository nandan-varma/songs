"use client";

import { WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";

interface PlayerContainerProps {
	isOffline: boolean;
	audioElement: ReactNode;
	children: ReactNode;
}

/**
 * Container with offline badge and floating card styling
 * Single responsibility: Layout wrapper
 */
export const PlayerContainer = memo(function PlayerContainer({
	isOffline,
	audioElement,
	children,
}: PlayerContainerProps) {
	return (
		<div className="fixed z-50 max-w-[1400px] mx-auto transition-all duration-300 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 md:bottom-6 md:left-6 md:right-6 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl md:rounded-full">
			{audioElement}

			{isOffline && (
				<div className="absolute -top-3 right-6 z-10">
					<Badge
						variant="secondary"
						className="flex items-center gap-1.5 bg-orange-500 text-white border-orange-600 shadow-md font-medium px-2.5 py-0.5"
					>
						<WifiOff className="h-3.5 w-3.5" />
						Offline
					</Badge>
				</div>
			)}

			<div className="min-h-[130px] md:min-h-[90px] px-4 py-3 md:py-2 md:px-6 flex items-center justify-center w-full mx-auto">
				{children}
			</div>
		</div>
	);
});
