import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import SearchContent from "@/components/search-content";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function Home({ searchParams }: Props) {
	return (
		<div className="min-h-screen bg-background">
			<ErrorBoundary context="SearchContent">
				<Suspense
					fallback={
						<div className="container mx-auto px-4 py-8">
							<div className="flex justify-center py-12">
								<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
							</div>
						</div>
					}
				>
					<SearchPage searchParams={searchParams} />
				</Suspense>
			</ErrorBoundary>
		</div>
	);
}

async function SearchPage({ searchParams }: Props) {
	const params = await searchParams;
	const _query = params.q as string;
	const _tab = (params.tab as string) || "all";
	const _page = parseInt(params.page as string, 10) || 0;

	return <SearchContent />;
}
