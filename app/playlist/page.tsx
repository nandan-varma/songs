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
			openGraph: {
				title: `${playlist.name} - Playlist`,
				description:
					playlist.description || `Listen to "${playlist.name}" playlist`,
				type: "music.playlist",
				images: playlist.image.length > 0 ? [playlist.image[0].url] : [],
			},
			twitter: {
				card: "summary_large_image",
				title: `${playlist.name} - Playlist`,
				description:
					playlist.description || `Listen to "${playlist.name}" playlist`,
				images: playlist.image.length > 0 ? [playlist.image[0].url] : [],
			},
		};
	} catch (_error) {
		return {
			title: "Playlist Not Found",
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
