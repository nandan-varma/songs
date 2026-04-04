import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoadingCard({ title }: { title: string }) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{[1, 2, 3].map((item) => (
						<div
							key={item}
							className="flex animate-pulse items-center gap-3 p-2"
						>
							<div className="h-10 w-10 rounded bg-muted" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-3 w-1/2 rounded bg-muted" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export function LibraryLoadingGrid() {
	return (
		<div className="container mx-auto py-6">
			<h1 className="mb-6 text-3xl font-bold">Library</h1>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<LoadingCard title="Favorites" />
				<LoadingCard title="Recently Played" />
				<LoadingCard title="Playlists" />
			</div>
		</div>
	);
}
