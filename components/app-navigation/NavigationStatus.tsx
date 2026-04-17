import { Wifi, WifiOff } from "lucide-react";

interface NavigationStatusProps {
	isOffline: boolean;
}

export function NavigationStatus({ isOffline }: NavigationStatusProps) {
	return (
		<div className="flex shrink-0 items-center gap-2 rounded-md border bg-card px-3 py-1.5">
			{isOffline ? (
				<WifiOff
					className="h-4 w-4 shrink-0 text-orange-500"
					aria-hidden="true"
				/>
			) : (
				<Wifi className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
			)}
			<span className="hidden whitespace-nowrap text-sm font-medium sm:inline">
				{isOffline ? "Offline" : "Online"}
			</span>
		</div>
	);
}
