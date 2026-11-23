import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<h1 className="text-xl font-semibold">Not found</h1>
			<Button asChild>
				<Link href="/">Back home</Link>
			</Button>
		</div>
	);
}
