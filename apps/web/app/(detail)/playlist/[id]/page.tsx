import { CollectionHeader } from "@/components/collection-header";
import { SongList } from "@/components/song-list";
import { getPlaylist } from "@/lib/api/data";

export default async function PlaylistPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const playlist = await getPlaylist(id);
	return (
		<div className="space-y-8">
			<CollectionHeader {...playlist} />
			<SongList tracks={playlist.tracks} />
		</div>
	);
}
