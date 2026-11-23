"use client";

import { Home, LayoutGrid, Library, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/new", label: "New", icon: Sparkles },
	{ href: "/browse", label: "Browse", icon: LayoutGrid },
	{ href: "/search", label: "Search", icon: Search },
	{ href: "/library", label: "Library", icon: Library },
] as const;

function isActive(pathname: string, href: string) {
	return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
	const pathname = usePathname();
	return (
		<nav aria-label="Main" className="hidden gap-1 md:flex">
			{LINKS.filter(({ href }) => href !== "/search").map(({ href, label }) => (
				<Link
					key={href}
					href={href}
					aria-current={isActive(pathname, href) ? "page" : undefined}
					className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground aria-[current=page]:text-foreground"
				>
					{label}
				</Link>
			))}
		</nav>
	);
}

export function BottomNav() {
	const pathname = usePathname();
	return (
		<nav
			aria-label="Main"
			className="grid grid-cols-5 border-t bg-background md:hidden"
		>
			{LINKS.map(({ href, label, icon: Icon }) => (
				<Link
					key={href}
					href={href}
					aria-current={isActive(pathname, href) ? "page" : undefined}
					className={cn(
						"flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground aria-[current=page]:text-primary",
					)}
				>
					<Icon className="size-5" />
					{label}
				</Link>
			))}
		</nav>
	);
}
