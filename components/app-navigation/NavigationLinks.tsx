import { Disc3Icon, DownloadIcon, HeartIcon } from "@animateicons/react/lucide";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { NavLabel } from "./nav-label";

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
		<Link
			href={href}
			aria-label={`Go to ${label.toLowerCase()} page`}
			title={label}
		>
			<Button
				variant="ghost"
				size="sm"
				className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
				aria-label={label}
			>
				<Icon size={16} />
				<NavLabel>{label}</NavLabel>
			</Button>
		</Link>
	);
}

export function NavigationLinks() {
	return (
		<div className="hidden items-center gap-1 md:flex">
			<NavigationLink href="/downloads" label="Downloads" icon={DownloadIcon} />
			<NavigationLink href="/favorites" label="Favorites" icon={HeartIcon} />
			<NavigationLink href="/library" label="Library" icon={Disc3Icon} />
		</div>
	);
}
