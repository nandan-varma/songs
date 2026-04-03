"use client";

import {
	Download,
	Library,
	Loader,
	LogIn,
	LogOut,
	Music,
	Smartphone,
	Wifi,
	WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { DevMenu } from "@/components/dev/dev-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDownloads } from "@/contexts/downloads-context";
import { useOffline } from "@/contexts/offline-context";
import { usePWAInstall } from "@/hooks/ui/use-pwa-install";
import { authClient } from "@/lib/auth-client";

export const Navigation = memo(function Navigation() {
	const { isDownloading } = useDownloads();
	const { isOfflineMode, cachedSongsCount } = useOffline();
	const { isInstallable, promptInstall } = usePWAInstall();
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between gap-4">
					{/* Left: Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 font-semibold text-lg flex-shrink-0"
					>
						<Music className="h-6 w-6" />
						<span className="hidden sm:inline">Music App</span>
					</Link>

					{/* Center: Spacer */}
					<div className="flex-1" />

					{/* Right: Action Buttons Group */}
					<div className="flex items-center gap-2">
						{/* Status Indicators Section */}
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card flex-shrink-0">
							{isOfflineMode ? (
								<WifiOff className="h-4 w-4 text-orange-500 flex-shrink-0" />
							) : (
								<Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
							)}
							<span className="hidden sm:inline text-sm font-medium whitespace-nowrap">
								{isOfflineMode ? "Offline" : "Online"}
							</span>
							{isOfflineMode && cachedSongsCount > 0 && (
								<Badge variant="secondary" className="text-xs flex-shrink-0">
									{cachedSongsCount}
								</Badge>
							)}
						</div>

						{/* Divider */}
						<div className="hidden sm:block w-px h-6 bg-border" />

						{/* Primary Actions Section */}
						<div className="flex items-center gap-1">
							{/* Downloads */}
							<Link href="/downloads" aria-label="Go to downloads">
								<Button
									variant="ghost"
									size="sm"
									className="relative flex-shrink-0"
									aria-label="Downloads"
								>
									<Download className="h-4 w-4" />
									<span className="hidden sm:inline ml-2 whitespace-nowrap">
										Downloads
									</span>
									{isDownloading && (
										<div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded animate-pulse" />
									)}
								</Button>
							</Link>

							{/* Library */}
							<Link href="/library" aria-label="Go to library">
								<Button
									variant="ghost"
									size="sm"
									className="flex-shrink-0"
									aria-label="Library"
								>
									<Library className="h-4 w-4" />
									<span className="hidden sm:inline ml-2 whitespace-nowrap">
										Library
									</span>
								</Button>
							</Link>
						</div>

						{/* Divider */}
						<div className="hidden sm:block w-px h-6 bg-border" />

						{/* Secondary Actions Section */}
						<div className="flex items-center gap-1">
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
										className="flex-shrink-0"
										aria-label="Install app"
									>
										<Smartphone className="h-4 w-4" />
										<span className="hidden sm:inline ml-2 whitespace-nowrap">
											Install
										</span>
									</Button>
								</motion.div>
							)}

							{/* Auth Button */}
							<div className="w-[38px] sm:w-auto flex-shrink-0">
								{isPending ? (
									<Button
										variant="ghost"
										size="sm"
										aria-label="Loading..."
										className="w-full"
									>
										<Loader className="h-4 w-4 animate-spin" />
									</Button>
								) : session ? (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => authClient.signOut()}
										aria-label="Logout"
										className="w-full"
									>
										<LogOut className="h-4 w-4" />
										<span className="hidden sm:inline ml-2 whitespace-nowrap">
											Logout
										</span>
									</Button>
								) : (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											router.push("/auth");
										}}
										aria-label="Login"
										className="w-full"
									>
										<LogIn className="h-4 w-4" />
										<span className="hidden sm:inline ml-2 whitespace-nowrap">
											Login
										</span>
									</Button>
								)}
							</div>
						</div>

						{/* Dev Menu */}
						{process.env.NODE_ENV === "development" && <DevMenu />}
					</div>
				</div>
			</div>
		</nav>
	);
});
