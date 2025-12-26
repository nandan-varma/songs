import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/error-boundary";
import { getSong } from "@/lib/data";
import { Client } from "./client";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
	searchParams,
}: Props): Promise<Metadata> {
	const id = (await searchParams).id;

	if (!id || typeof id !== "string") {
		return {
			title: "Song Not Found",
		};
	}

	try {
		const songs = await getSong(id);
		const song = songs[0];

		if (!song) {
			return {
				title: "Song Not Found",
			};
		}

		const primaryArtists = song.artists.primary
			.map((artist) => artist.name)
			.join(", ");

		return {
			title: `${song.name} - ${primaryArtists}`,
			description: `Listen to "${song.name}" by ${primaryArtists} from ${song.album.name}. ${song.language ? `Language: ${song.language}.` : ""} ${song.year ? `Year: ${song.year}.` : ""}`,
			openGraph: {
				title: `${song.name} - ${primaryArtists}`,
				description: `Listen to "${song.name}" by ${primaryArtists} from ${song.album.name}`,
				type: "music.song",
				images: song.image.length > 0 ? [song.image[0].url] : [],
			},
			twitter: {
				card: "summary_large_image",
				title: `${song.name} - ${primaryArtists}`,
				description: `Listen to "${song.name}" by ${primaryArtists} from ${song.album.name}`,
				images: song.image.length > 0 ? [song.image[0].url] : [],
			},
		};
	} catch (_error) {
		return {
			title: "Song Not Found",
		};
	}
}

export default function Page() {
	return (
		<ErrorBoundary>
			<Client />
		</ErrorBoundary>
	);
}
