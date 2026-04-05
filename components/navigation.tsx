"use client";

import { NavigationActions } from "@/components/app-navigation/NavigationActions";
import { NavigationBrand } from "@/components/app-navigation/NavigationBrand";
import { NavigationLinks } from "@/components/app-navigation/NavigationLinks";
import { NavigationStatus } from "@/components/app-navigation/NavigationStatus";
import { useIsOffline } from "@/hooks/network/use-is-offline";

export function Navigation() {
	const isOffline = useIsOffline();

	return (
		<nav
			className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40"
			aria-label="Main navigation"
		>
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between gap-4">
					<NavigationBrand />
					<div className="flex-1" />
					<div className="flex items-center gap-2">
						<NavigationStatus isOffline={isOffline} />
						<div
							className="hidden sm:block w-px h-6 bg-border"
							aria-hidden="true"
						/>
						<NavigationLinks />
						<div
							className="hidden sm:block w-px h-6 bg-border"
							aria-hidden="true"
						/>
						<NavigationActions />
					</div>
				</div>
			</div>
		</nav>
	);
}
