"use client";

import { Download, Heart, Home, Library } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { isValidRoute, VALID_ROUTES } from "@/lib/constants";

/**
 * Mobile Bottom Navigation
 * - Fixed at bottom on mobile
 * - Hidden on desktop/tablet
 * - Touch-friendly with 48px height
 * - Shows icons with labels
 * - Responsive link highlighting
 */
export const MobileBottomNav = memo(function MobileBottomNav() {
	const router = useRouter();
	const pathname = usePathname();

	const navItems = [
		{ path: VALID_ROUTES[0], icon: Home, label: "Home" },
		{ path: VALID_ROUTES[1], icon: Library, label: "Library" },
		{ path: VALID_ROUTES[2], icon: Download, label: "Downloads" },
		{ path: VALID_ROUTES[3], icon: Heart, label: "Favorites" },
	] as const;

	const isActive = useCallback(
		(path: string): boolean => {
			if (path === "/") {
				return pathname === "/";
			}
			return pathname?.startsWith(path) ?? false;
		},
		[pathname],
	);

	const handleNavigation = useCallback(
		(path: string) => {
			if (isValidRoute(path)) {
				router.push(path as never);
			}
		},
		[router],
	);

	return (
		<nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background/95 backdrop-blur-sm z-40">
			<div className="flex items-stretch justify-around h-16 sm:h-14">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active = isActive(item.path);

					return (
						<motion.div
							key={item.path}
							className="flex-1"
							whileTap={{ scale: 0.95 }}
						>
							<button
								type="button"
								onClick={() => handleNavigation(item.path)}
								className={`w-full h-full flex flex-col items-center justify-center px-2 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
									active
										? "text-primary bg-primary/10"
										: "text-muted-foreground hover:text-foreground hover:bg-accent/50"
								}`}
								aria-label={item.label}
								aria-current={active ? "page" : undefined}
							>
								<Icon className="h-6 w-6 sm:h-5 sm:w-5" />
								<span className="text-xs sm:text-[10px] mt-1 font-medium truncate whitespace-nowrap">
									{item.label}
								</span>
							</button>
						</motion.div>
					);
				})}
			</div>
		</nav>
	);
});
