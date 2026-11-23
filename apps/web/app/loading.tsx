import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="space-y-6" aria-busy>
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{Array.from({ length: 8 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
					<Skeleton key={i} className="aspect-square" />
				))}
			</div>
		</div>
	);
}
