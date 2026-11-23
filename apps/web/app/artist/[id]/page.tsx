import { CollectionHeader } from "@/components/collection-header";
import { CardGrid } from "@/components/media-card";
import { Section } from "@/components/section";
import { TrackList } from "@/components/track-list";
import { getArtist } from "@/lib/api/data";

export default async function ArtistPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const artist = await getArtist(id);
	return (
		<div className="space-y-10">
			<CollectionHeader
				title={artist.title}
				meta={artist.meta}
				image={artist.image}
				tracks={artist.songs}
				round
			/>
			{artist.songs.length > 0 && (
				<Section title="Top songs">
					<TrackList tracks={artist.songs} />
				</Section>
			)}
			{artist.albums.length > 0 && (
				<Section title="Albums">
					<CardGrid cards={artist.albums} />
				</Section>
			)}
			{artist.similar.length > 0 && (
				<Section title="Similar artists">
					<CardGrid cards={artist.similar} />
				</Section>
			)}
		</div>
	);
}
