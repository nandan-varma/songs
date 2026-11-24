import { CollectionHeader } from "@/components/collection-header";
import { SongList } from "@/components/song-list";
import { getAlbum } from "@/lib/api/data";

export const revalidate = 300;

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
			<SongList tracks={album.tracks} />
		</div>
	);
}
