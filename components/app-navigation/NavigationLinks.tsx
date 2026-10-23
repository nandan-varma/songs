import { Disc3Icon, DownloadIcon, HeartIcon } from "@animateicons/react/lucide";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";

function NavigationLink({
	href,
	label,
	icon: Icon,
}: {
	href: Route;
	label: string;
	icon: ComponentType<{ size?: number }>;
}) {
	return (
		<Link href={href} aria-label={`Go to ${label.toLowerCase()} page`}>
			<Button
				variant="ghost"
				size="sm"
				className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
				aria-label={label}
			>
				<Icon size={16} />
				<span className="ml-2 hidden whitespace-nowrap sm:inline">{label}</span>
			</Button>
		</Link>
	);
}

export function NavigationLinks() {
	return (
		<div className="flex items-center gap-1">
			<NavigationLink href="/downloads" label="Downloads" icon={DownloadIcon} />
			<NavigationLink href="/favorites" label="Favorites" icon={HeartIcon} />
			<NavigationLink href="/library" label="Library" icon={Disc3Icon} />
		</div>
	);
}
