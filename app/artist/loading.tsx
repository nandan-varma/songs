import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			{/* Artist Header */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Artist Image Skeleton */}
						<Skeleton className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-full" />

						{/* Artist Details Skeleton */}
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

							{/* Social Links Skeleton */}
							<div className="flex gap-2">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-16" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs Skeleton */}
			<Tabs defaultValue="songs" className="space-y-4">
				<TabsList>
					<TabsTrigger value="songs">Top Songs</TabsTrigger>
					<TabsTrigger value="albums">Albums</TabsTrigger>
					<TabsTrigger value="singles">Singles</TabsTrigger>
					<TabsTrigger value="bio">Bio</TabsTrigger>
				</TabsList>

				{/* Top Songs Skeleton */}
				<TabsContent value="songs" className="space-y-4">
					<Skeleton className="h-10 w-24" />
					<div className="space-y-4">
						{Array.from({ length: 10 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
								key={`song-skeleton-${i}`}
								className="flex items-center gap-4 p-4 rounded-lg border"
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

				{/* Albums Skeleton */}
				<TabsContent value="albums" className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
							<Card key={`album-skeleton-${i}`}>
								<CardContent className="p-4">
									<Skeleton className="aspect-square w-full rounded" />
									<div className="space-y-2 mt-3">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-3 w-1/2" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				{/* Singles Skeleton */}
				<TabsContent value="singles" className="space-y-4">
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
								key={`single-skeleton-${i}`}
								className="flex items-center gap-4 p-4 rounded-lg border"
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

				{/* Bio Skeleton */}
				<TabsContent value="bio" className="space-y-4">
					<Card>
						<CardContent className="p-6 space-y-4">
							<Skeleton className="h-6 w-1/4" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-6 w-1/3" />
							<Skeleton className="h-4 w-full" />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Similar Artists Skeleton */}
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
						<Card key={`artist-skeleton-${i}`}>
							<CardContent className="p-4">
								<Skeleton className="aspect-square w-full rounded-full" />
								<div className="text-center mt-3">
									<Skeleton className="h-4 w-3/4 mx-auto" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
