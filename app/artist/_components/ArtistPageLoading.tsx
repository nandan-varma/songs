import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ArtistPageLoading() {
	return (
		<div className="container mx-auto space-y-8 px-4 py-8 pb-32">
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col gap-6 md:flex-row">
						<Skeleton className="relative aspect-square w-full shrink-0 rounded-full md:w-64" />
						<div className="flex-1 space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-10 w-3/4" />
							</div>
							<div className="flex gap-4">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-12" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-16" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Tabs defaultValue="songs" className="space-y-4">
				<TabsList>
					<TabsTrigger value="songs">Top Songs</TabsTrigger>
					<TabsTrigger value="albums">Albums</TabsTrigger>
					<TabsTrigger value="singles">Singles</TabsTrigger>
					<TabsTrigger value="bio">Bio</TabsTrigger>
				</TabsList>

				<TabsContent value="songs" className="space-y-4">
					<Skeleton className="h-10 w-24" />
					<div className="space-y-4">
						{Array.from({ length: 10 }).map((_, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
								key={`song-skeleton-${index}`}
								className="flex items-center gap-4 rounded-lg border p-4"
							>
								<Skeleton className="h-12 w-12 rounded" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
								<Skeleton className="h-8 w-8" />
							</div>
						))}
					</div>
				</TabsContent>

				<TabsContent value="albums" className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
							<Card key={`album-skeleton-${index}`}>
								<CardContent className="p-4">
									<Skeleton className="aspect-square w-full rounded" />
									<div className="mt-3 space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-3 w-1/2" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="singles" className="space-y-4">
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
								key={`single-skeleton-${index}`}
								className="flex items-center gap-4 rounded-lg border p-4"
							>
								<Skeleton className="h-12 w-12 rounded" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
								<Skeleton className="h-8 w-8" />
							</div>
						))}
					</div>
				</TabsContent>

				<TabsContent value="bio" className="space-y-4">
					<Card>
						<CardContent className="space-y-4 p-6">
							<Skeleton className="h-6 w-1/4" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-6 w-1/3" />
							<Skeleton className="h-4 w-full" />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
						<Card key={`artist-skeleton-${index}`}>
							<CardContent className="p-4">
								<Skeleton className="aspect-square w-full rounded-full" />
								<div className="mt-3 text-center">
									<Skeleton className="mx-auto h-4 w-3/4" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
