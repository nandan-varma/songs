import { Download, Heart, Library } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function NavigationLink({
	href,
	label,
	icon: Icon,
}: {
	href: Route;
	label: string;
	icon: typeof Download | typeof Heart | typeof Library;
}) {
	return (
		<Link href={href} aria-label={`Go to ${label.toLowerCase()} page`}>
			<Button
				variant="ghost"
				size="sm"
				className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
				aria-label={label}
			>
				<Icon className="h-4 w-4" aria-hidden="true" />
				<span className="ml-2 hidden whitespace-nowrap sm:inline">{label}</span>
			</Button>
		</Link>
	);
}

export function NavigationLinks() {
	return (
		<div className="flex items-center gap-1">
			<NavigationLink href="/downloads" label="Downloads" icon={Download} />
			<NavigationLink href="/favorites" label="Favorites" icon={Heart} />
			<NavigationLink href="/library" label="Library" icon={Library} />
		</div>
	);
}
