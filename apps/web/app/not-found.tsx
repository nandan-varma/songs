import Link from "next/link";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center gap-2">
			<EmptyState title="Not found" />
			<Button asChild>
				<Link href="/">Back home</Link>
			</Button>
		</div>
	);
}
