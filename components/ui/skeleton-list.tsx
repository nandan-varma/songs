"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SongListSkeleton({ count = 10 }: { count?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 p-2">
					<Skeleton className="h-12 w-12 shrink-0 rounded" />
					<div className="space-y-2 flex-1 min-w-0">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
					</div>
					<Skeleton className="h-8 w-8 rounded" />
				</div>
			))}
		</div>
	);
}

export function AlbumCardSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="aspect-square w-full rounded-lg" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-1/2" />
		</div>
	);
}

export function ArtistCardSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="aspect-square w-full rounded-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-1/2" />
		</div>
	);
}

export function PlaylistCardSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="aspect-square w-full rounded-lg" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-1/2" />
		</div>
	);
}

export function SearchResultsSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-6 w-32 mb-3" />
				<SongListSkeleton count={5} />
			</div>
			<div>
				<Skeleton className="h-6 w-32 mb-3" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<AlbumCardSkeleton key={i} />
					))}
				</div>
			</div>
			<div>
				<Skeleton className="h-6 w-32 mb-3" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<ArtistCardSkeleton key={i} />
					))}
				</div>
			</div>
		</div>
	);
}
