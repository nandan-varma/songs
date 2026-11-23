"use client";

import { Home, Library, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/search", label: "Search", icon: Search },
	{ href: "/library", label: "Library", icon: Library },
] as const;

function isActive(pathname: string, href: string) {
	return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
	const pathname = usePathname();
	return (
		<nav className="hidden gap-1 md:flex">
			{LINKS.map(({ href, label }) => (
				<Link
					key={href}
					href={href}
					className={cn(
						"rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground",
						isActive(pathname, href) && "bg-accent text-foreground",
					)}
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
		<nav className="grid grid-cols-3 border-t bg-background md:hidden">
			{LINKS.map(({ href, label, icon: Icon }) => (
				<Link
					key={href}
					href={href}
					className={cn(
						"flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground",
						isActive(pathname, href) && "text-foreground",
					)}
				>
					<Icon className="size-5" />
					{label}
				</Link>
			))}
		</nav>
	);
}
