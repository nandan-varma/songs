"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { Suspense, useState } from "react";
import { NavigationActions } from "@/components/app-navigation/NavigationActions";
import { NavigationBrand } from "@/components/app-navigation/NavigationBrand";
import { NavigationLinks } from "@/components/app-navigation/NavigationLinks";
import { NavigationSearch } from "@/components/app-navigation/NavigationSearch";
import { NavigationStatus } from "@/components/app-navigation/NavigationStatus";
import { NavCondensedProvider } from "@/components/app-navigation/nav-label";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { cn } from "@/lib/utils";

const CONDENSE_AFTER_PX = 48;

export function Navigation() {
	const isOffline = useIsOffline();
	const { scrollY } = useScroll();
	const [condensed, setCondensed] = useState(false);

	useMotionValueEvent(scrollY, "change", (y) =>
		setCondensed(y > CONDENSE_AFTER_PX),
	);

	return (
		<NavCondensedProvider value={condensed}>
			<nav
				className={cn(
					"sticky top-0 z-40 border-b bg-background/95 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-background/80",
					condensed && "shadow-md",
				)}
				aria-label="Main navigation"
			>
				<div className="container mx-auto px-4">
					<div
						className={cn(
							"flex items-center gap-3 transition-[height] duration-200 md:gap-4",
							condensed ? "h-14" : "h-16",
						)}
					>
						<NavigationBrand />
						<Suspense fallback={<div className="flex-1" />}>
							<NavigationSearch />
						</Suspense>
						<div className="ml-auto flex items-center gap-2">
							<NavigationStatus isOffline={isOffline} />
							<NavigationLinks />
							<NavigationActions />
						</div>
					</div>
				</div>
			</nav>
		</NavCondensedProvider>
	);
}
