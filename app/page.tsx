import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { SearchContent } from "@/components/search-content";

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<Suspense
				fallback={
					<div className="container mx-auto px-4 py-8">
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					</div>
				}
			>
				<SearchContent />
			</Suspense>
		</div>
	);
}
