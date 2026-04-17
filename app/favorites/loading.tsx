import { Loader2 } from "lucide-react";

export default function Loading() {
	return (
		<div className="container mx-auto py-6 px-4 sm:px-6 max-w-7xl flex justify-center min-h-[50vh]">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	);
}
