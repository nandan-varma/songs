import { Suspense } from "react";
import { SearchResults } from "@/components/search-results";
import { SongListSkeleton } from "@/components/skeletons";

export const metadata = { title: "Search" };

export default function SearchPage() {
	return (
		<Suspense fallback={<SongListSkeleton />}>
			<SearchResults />
		</Suspense>
	);
}
