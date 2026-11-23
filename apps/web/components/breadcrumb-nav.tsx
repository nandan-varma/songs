"use client";

import { ChevronLeft, Disc3, Home, ListMusic, Music, User } from "lucide-react";
import { motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface BreadcrumbSegment {
	label: string;
	href: string;
	isCurrentPage: boolean;
	icon?: React.ReactNode;
}

const routeLabels: Record<string, string> = {
	songs: "Songs",
	albums: "Albums",
	artists: "Artists",
	playlists: "Playlists",
};

const routeIcons: Record<string, React.ReactNode> = {
	songs: <Music className="h-3.5 w-3.5" />,
	albums: <Disc3 className="h-3.5 w-3.5" />,
	artists: <User className="h-3.5 w-3.5" />,
	playlists: <ListMusic className="h-3.5 w-3.5" />,
};

export function BreadcrumbNav() {
	const pathname = usePathname();
	const router = useRouter();

	const breadcrumbs = useMemo<BreadcrumbSegment[]>(() => {
		if (pathname === "/") {
			return [];
		}

		const segments = pathname.split("/").filter(Boolean);
		const crumbs: BreadcrumbSegment[] = [];

		// Build breadcrumb segments
		let currentPath = "";
		segments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const isLast = index === segments.length - 1;
			const isCategory = routeLabels[segment] !== undefined;

			// Format label - use predefined labels or capitalize
			let label =
				routeLabels[segment] ||
				segment.charAt(0).toUpperCase() + segment.slice(1);
			let icon = routeIcons[segment];

			// If it's an ID (likely numeric or alphanumeric), show as "View"
			if (
				index > 0 &&
				/^[0-9a-zA-Z_-]+$/.test(segment) &&
				segment.length > 3 &&
				!routeLabels[segment]
			) {
				label = "View";
				icon = undefined;
			}

			crumbs.push({
				label,
				href: isCategory ? "#" : currentPath, // Categories are not clickable
				isCurrentPage: isLast || isCategory, // Treat categories as current page (non-clickable)
				icon,
			});
		});

		return crumbs;
	}, [pathname]);

	// Don't show breadcrumbs on home page
	if (pathname === "/" || breadcrumbs.length === 0) {
		return null;
	}

	return (
		<motion.div
			className="border-b bg-muted/30"
			initial={{ y: -10, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<div className="container mx-auto px-4 py-3">
				<div className="flex items-center gap-3 min-h-[40px]">
					{/* Back Button - Fixed Width */}
					<motion.div
						whileHover={{ x: -3 }}
						whileTap={{ scale: 0.95 }}
						className="flex-shrink-0"
					>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.back()}
							aria-label="Go back"
							className="h-9 w-9"
						>
							<ChevronLeft className="h-5 w-5" />
						</Button>
					</motion.div>

					{/* Divider */}
					<div className="w-px h-6 bg-border flex-shrink-0" />

					{/* Breadcrumbs */}
					<Breadcrumb className="flex-1 min-w-0">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href="/" className="flex items-center gap-1.5">
										<Home className="h-3.5 w-3.5 flex-shrink-0" />
										<span className="truncate">Home</span>
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							{breadcrumbs.map((crumb: BreadcrumbSegment) => (
								<div key={crumb.href} className="flex items-center gap-1.5">
									<BreadcrumbSeparator className="flex-shrink-0" />
									<BreadcrumbItem>
										{crumb.isCurrentPage ? (
											<BreadcrumbPage className="flex items-center gap-1.5 truncate">
												{crumb.icon && (
													<span className="flex-shrink-0">{crumb.icon}</span>
												)}
												<span className="truncate">{crumb.label}</span>
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink asChild>
												<Link
													href={crumb.href as Route}
													className="flex items-center gap-1.5 truncate"
												>
													{crumb.icon && (
														<span className="flex-shrink-0">{crumb.icon}</span>
													)}
													<span className="truncate">{crumb.label}</span>
												</Link>
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								</div>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>
		</motion.div>
	);
}
