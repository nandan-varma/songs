import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/error-boundary";
import { getPlaylist } from "@/lib/data";
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
			title: "Playlist Not Found",
		};
	}

	try {
		const playlist = await getPlaylist(id);

		return {
			title: `${playlist.name} - Playlist`,
			description:
				playlist.description ||
				`Listen to "${playlist.name}" playlist. ${playlist.songCount ? `${playlist.songCount} songs` : ""}.`,
		};
	} catch (_error) {
		return {
			title: "Playlist Not Found",
		};
	}
}

async function PlaylistPage({ id }: { id: string }) {
	const playlist = await getPlaylist(id);

	return <Client playlist={playlist} />;
}

export default function Page({ searchParams }: Props) {
	return (
		<ErrorBoundary>
			<PlaylistPageContent searchParams={searchParams} />
		</ErrorBoundary>
	);
}

async function PlaylistPageContent({ searchParams }: Props) {
	const id = (await searchParams).id;

	if (!id || typeof id !== "string") {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Playlist ID is required</p>
			</div>
		);
	}

	return <PlaylistPage id={id} />;
}
