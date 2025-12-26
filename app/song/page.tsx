import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/error-boundary";
import { getSong, getSongSuggestions } from "@/lib/data";
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
		};
	} catch (_error) {
		return {
			title: "Song Not Found",
		};
	}
}

async function SongPage({ id }: { id: string }) {
	const songs = await getSong(id);
	const song = songs[0];

	if (!song) {
		throw new Error("Song not found");
	}

	// Fetch song suggestions
	const suggestions = await getSongSuggestions(id, 10);

	return <Client song={song} suggestions={suggestions} />;
}

export default function Page({ searchParams }: Props) {
	return (
		<ErrorBoundary>
			<SongPageContent searchParams={searchParams} />
		</ErrorBoundary>
	);
}

async function SongPageContent({ searchParams }: Props) {
	const id = (await searchParams).id;

	if (!id || typeof id !== "string") {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Song ID is required</p>
			</div>
		);
	}

	return <SongPage id={id} />;
}
