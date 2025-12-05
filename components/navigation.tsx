"use client";

import { Download, Music, Wifi, WifiOff, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useDownloads } from "@/contexts/downloads-context";
import { useOffline } from "@/contexts/offline-context";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export function Navigation() {
	const { downloads, isProcessing } = useDownloads();
	const { isOfflineMode, setOfflineMode, cachedSongsCount } = useOffline();
	const { isInstallable, promptInstall } = usePWAInstall();
	const queueCount = downloads.filter((item) => 
		item.status === "pending" || item.status === "downloading"
	).length;

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-6">
						<Link
							href="/"
							className="flex items-center gap-2 font-semibold text-lg"
						>
							<Music className="h-6 w-6" />
							<span>Music App</span>
						</Link>

						<div className="hidden md:flex items-center gap-2"></div>
					</div>

					<div className="flex items-center gap-4">
						{/* PWA Install Button */}
						{isInstallable && (
							<Button
								variant="outline"
								size="sm"
								onClick={promptInstall}
								className="hidden sm:flex"
							>
								<Smartphone className="h-4 w-4 mr-2" />
								Install App
							</Button>
						)}

						{/* Offline Mode Toggle */}
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card">
						{isOfflineMode ? (
							<WifiOff className="h-4 w-4 text-orange-500" />
						) : (
							<Wifi className="h-4 w-4 text-green-500" />
						)}
						<Switch
							checked={isOfflineMode}
							onCheckedChange={setOfflineMode}
							disabled
							aria-label="Network status (automatic)"
						/>
						<span className="hidden sm:inline text-sm font-medium">
							{isOfflineMode ? "Offline" : "Online"}
						</span>
							{isOfflineMode && cachedSongsCount > 0 && (
								<Badge variant="secondary" className="text-xs">
									{cachedSongsCount}
								</Badge>
							)}
						</div>

						<Link href="/downloads">
							<Button variant="ghost" size="sm" className="relative">
								<Download className="h-4 w-4" />
								<span className="hidden sm:inline ml-2">Downloads</span>
								{queueCount > 0 && (
									<Badge 
										variant="secondary" 
										className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
									>
										{queueCount}
									</Badge>
								)}
								{isProcessing && (
									<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded animate-pulse" />
								)}
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
}
