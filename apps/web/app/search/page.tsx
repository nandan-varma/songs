import { Suspense } from "react";
import { SearchView } from "@/components/search-view";

export const metadata = { title: "Search" };

export default function SearchPage() {
	return (
		<Suspense>
			<SearchView />
		</Suspense>
	);
}
