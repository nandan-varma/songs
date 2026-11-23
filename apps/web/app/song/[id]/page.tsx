import { CollectionHeader } from "@/components/collection-header";
import { DownloadButton } from "@/components/download-button";
import { Lyrics } from "@/components/lyrics";
import { Section } from "@/components/section";
import { Suggestions } from "@/components/suggestions";
import { getSong } from "@/lib/api/data";

export default async function SongPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const { track, meta, lyricsId } = await getSong(id);
	return (
		<div className="space-y-10">
			<CollectionHeader
				title={track.title}
				subtitle={track.artists.map((artist) => artist.name).join(", ")}
				meta={meta}
				image={track.image}
				tracks={[track]}
			>
				<DownloadButton track={track} />
			</CollectionHeader>
			{lyricsId && (
				<Section title="Lyrics">
					<Lyrics lyricsId={lyricsId} />
				</Section>
			)}
			<Section title="You might also like">
				<Suggestions songId={id} />
			</Section>
		</div>
	);
}
