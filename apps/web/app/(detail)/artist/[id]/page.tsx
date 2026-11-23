import { CollectionGrid } from "@/components/collection-card";
import { CollectionHeader } from "@/components/collection-header";
import { Section } from "@/components/section";
import { SongList } from "@/components/song-list";
import { getArtist } from "@/lib/api/data";

export default async function ArtistPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const artist = await getArtist(id);
	return (
		<div className="space-y-8">
			<CollectionHeader
				title={artist.title}
				meta={artist.meta}
				image={artist.image}
				tracks={artist.songs}
				round
			/>
			{artist.songs.length > 0 && (
				<Section title="Top songs">
					<SongList tracks={artist.songs} />
				</Section>
			)}
			{artist.albums.length > 0 && (
				<Section title="Albums">
					<CollectionGrid cards={artist.albums} />
				</Section>
			)}
			{artist.similar.length > 0 && (
				<Section title="Similar artists">
					<CollectionGrid cards={artist.similar} />
				</Section>
			)}
		</div>
	);
}
