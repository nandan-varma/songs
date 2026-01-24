"use client";

import {
	Download,
	Library,
	Music,
	Smartphone,
	Wifi,
	WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { DevMenu } from "@/components/dev/dev-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/ui/use-pwa-install";
import { useDownloadsStore } from "@/stores/downloads-store";
import { useOfflineStore } from "@/stores/offline-store";

export const Navigation = memo(function Navigation() {
	const [mounted, setMounted] = useState(false);
	const isDownloading = useDownloadsStore((state) => state.isDownloading);
	const isOnline = useOfflineStore((state) => state.isOnline);
	const cachedSongsCount = useOfflineStore((state) => state.cachedSongsCount());
	const { isInstallable, promptInstall } = usePWAInstall();

	useEffect(() => {
		setMounted(true);
	}, []);

	const isOfflineMode = !isOnline;

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
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.98 }}
							>
								<Button
									variant="outline"
									size="sm"
									onClick={promptInstall}
									className="hidden sm:flex"
									aria-label="Install app"
								>
									<Smartphone className="h-4 w-4 mr-2" />
									Install App
								</Button>
							</motion.div>
						)}

						{/* Offline Mode Toggle */}
						<div
							className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card"
							suppressHydrationWarning
						>
							{mounted && isOfflineMode ? (
								<WifiOff className="h-4 w-4 text-orange-500" />
							) : (
								<Wifi className="h-4 w-4 text-green-500" />
							)}
							<span className="hidden sm:inline text-sm font-medium">
								{mounted && isOfflineMode ? "Offline" : "Online"}
							</span>
							{mounted && isOfflineMode && cachedSongsCount > 0 && (
								<Badge variant="secondary" className="text-xs">
									{cachedSongsCount}
								</Badge>
							)}
						</div>

						<Link href="/downloads" aria-label="Go to downloads">
							<Button
								variant="ghost"
								size="sm"
								className="relative"
								aria-label="Downloads"
							>
								<Download className="h-4 w-4" />
								<span className="hidden sm:inline ml-2">Downloads</span>
								<span className="sr-only">Downloads</span>
								{isDownloading && (
									<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded animate-pulse" />
								)}
							</Button>
						</Link>

						<Link href="/library" aria-label="Go to library">
							<Button variant="ghost" size="sm" aria-label="Library">
								<Library className="h-4 w-4" />
								<span className="hidden sm:inline ml-2">Library</span>
								<span className="sr-only">Library</span>
							</Button>
						</Link>

						{process.env.NODE_ENV === "development" && <DevMenu />}
					</div>
				</div>
			</div>
		</nav>
	);
});
