import {
	CollectionGridSkeleton,
	SongListSkeleton,
} from "@/components/skeletons";

export default function Loading() {
	return (
		<div className="space-y-8">
			<SongListSkeleton count={5} />
			<CollectionGridSkeleton />
		</div>
	);
}
