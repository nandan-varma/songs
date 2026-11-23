import { CollectionHeader } from "@/components/collection-header";
import { TrackList } from "@/components/track-list";
import { getAlbum } from "@/lib/api/data";

export default async function AlbumPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const album = await getAlbum(id);
	return (
		<div className="space-y-8">
			<CollectionHeader {...album} />
			<TrackList tracks={album.tracks} />
		</div>
	);
}
