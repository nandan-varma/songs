import { WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PlayerContainerProps {
	isOfflineMode: boolean;
	audioElement: ReactNode;
	children: ReactNode;
}

/**
 * Container with offline badge and card styling
 * Single responsibility: Layout wrapper
 */
export const PlayerContainer = memo(function PlayerContainer({
	isOfflineMode,
	audioElement,
	children,
}: PlayerContainerProps) {
	return (
		<div className="fixed bottom-6 left-4 right-4 md:left-6 md:right-6 z-50 max-w-7xl mx-auto">
			<Card className="bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/90 border shadow-2xl">
				{audioElement}

				{isOfflineMode && (
					<div className="absolute -top-2 right-4 z-10">
						<Badge
							variant="secondary"
							className="flex items-center gap-1 bg-orange-500/90 text-white border-orange-600"
						>
							<WifiOff className="h-3 w-3" />
							Offline Mode
						</Badge>
					</div>
				)}

				<div className="px-3 md:px-6 py-2.5 md:py-5">{children}</div>
			</Card>
		</div>
	);
});
