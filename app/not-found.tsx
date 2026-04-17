import Link from "next/link";
import { Home, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
			<h1 className="text-6xl font-bold mb-4">404</h1>
			<h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
			<p className="text-muted-foreground mb-8 max-w-md">
				The page you are looking for does not exist or has been moved.
			</p>
			<div className="flex gap-4">
				<Button asChild>
					<Link href="/" className="flex items-center gap-2">
						<Home className="h-4 w-4" />
						Go Home
					</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/library" className="flex items-center gap-2">
						<Library className="h-4 w-4" />
						Library
					</Link>
				</Button>
			</div>
		</div>
	);
}
