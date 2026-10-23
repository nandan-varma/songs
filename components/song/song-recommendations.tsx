import { SongsList } from "@/components/songs-list";
import { detailedSongToSong } from "@/lib/utils";
import type { DetailedSong } from "@/types/entity";

interface SongSectionProps {
	title: string;
	songs: DetailedSong[];
}

/** A titled list of songs; renders nothing when empty so absent data never leaves a blank section. */
export function SongSection({ title, songs }: SongSectionProps) {
	if (songs.length === 0) return null;

	return (
		<section className="space-y-2">
			<h2 className="text-xl font-semibold">{title}</h2>
			<SongsList songs={songs.map(detailedSongToSong)} detailedSongs={songs} />
		</section>
	);
}
