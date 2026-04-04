import { Music } from "lucide-react";
import Link from "next/link";

export function NavigationBrand() {
	return (
		<Link
			href="/"
			className="flex flex-shrink-0 items-center gap-2 rounded font-semibold text-lg transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
			aria-label="Music App Home"
		>
			<Music className="h-6 w-6" />
			<span className="hidden sm:inline">Music App</span>
		</Link>
	);
}
