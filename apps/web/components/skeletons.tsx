import { Skeleton } from "@/components/ui/skeleton";

function repeat(count: number) {
	return Array.from({ length: count }, (_, i) => i);
}

export function SongListSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div aria-busy className="divide-y divide-border">
			{repeat(count).map((i) => (
				<div key={i} className="flex h-[4.5rem] items-center gap-3">
					<Skeleton className="size-12 shrink-0" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-2/5" />
						<Skeleton className="h-3 w-1/4" />
					</div>
				</div>
			))}
		</div>
	);
}

export function CollectionGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div
			aria-busy
			className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
		>
			{repeat(count).map((i) => (
				<div key={i} className="space-y-2">
					<Skeleton className="aspect-square" />
					<Skeleton className="h-4 w-4/5" />
				</div>
			))}
		</div>
	);
}

export function DetailSkeleton() {
	return (
		<div className="space-y-8">
			<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
				<Skeleton className="aspect-square w-3/5 sm:w-56" />
				<div className="w-full space-y-3 sm:flex-1">
					<Skeleton className="h-9 w-2/3" />
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-11 w-48" />
				</div>
			</div>
			<SongListSkeleton count={8} />
		</div>
	);
}
