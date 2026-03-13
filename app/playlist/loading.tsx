import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			{/* Playlist Header */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Playlist Cover Skeleton */}
						<Skeleton className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-lg" />

						{/* Playlist Details Skeleton */}
						<div className="flex-1 space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-6 w-20" />
								<Skeleton className="h-10 w-3/4" />
							</div>

							<div className="flex gap-4">
								<Skeleton className="h-4 w-12" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-4 w-20" />
							</div>
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />

							{/* Action Buttons Skeleton */}
							<div className="flex gap-2">
								<Skeleton className="h-11 w-24" />
								<Skeleton className="h-11 w-32" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Track List Skeleton */}
			<div className="space-y-4">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
						key={`track-skeleton-${i}`}
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
		</div>
	);
}
