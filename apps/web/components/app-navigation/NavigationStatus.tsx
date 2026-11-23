import { Wifi, WifiOff } from "lucide-react";
import { NavLabel } from "./nav-label";

interface NavigationStatusProps {
	isOffline: boolean;
}

export function NavigationStatus({ isOffline }: NavigationStatusProps) {
	return (
		<div
			className="flex flex-shrink-0 items-center rounded-md border bg-card px-3 py-1.5"
			title={isOffline ? "Offline" : "Online"}
		>
			{isOffline ? (
				<WifiOff
					className="h-4 w-4 flex-shrink-0 text-orange-500"
					aria-hidden="true"
				/>
			) : (
				<Wifi
					className="h-4 w-4 flex-shrink-0 text-green-500"
					aria-hidden="true"
				/>
			)}
			<NavLabel>{isOffline ? "Offline" : "Online"}</NavLabel>
		</div>
	);
}
