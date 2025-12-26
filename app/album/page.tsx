import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/error-boundary";
import { getAlbum } from "@/lib/data";
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
			title: "Album Not Found",
		};
	}

	try {
		const album = await getAlbum(id);
		const primaryArtists = album.artists.primary
			.map((artist) => artist.name)
			.join(", ");

		return {
			title: `${album.name} - ${primaryArtists}`,
			description:
				album.description ||
				`Listen to ${album.name} by ${primaryArtists}. ${album.songCount ? `${album.songCount} songs` : ""}${album.year ? ` from ${album.year}` : ""}.`,
			openGraph: {
				title: `${album.name} - ${primaryArtists}`,
				description:
					album.description || `Listen to ${album.name} by ${primaryArtists}`,
				type: "music.album",
				images: album.image.length > 0 ? [album.image[0].url] : [],
			},
			twitter: {
				card: "summary_large_image",
				title: `${album.name} - ${primaryArtists}`,
				description:
					album.description || `Listen to ${album.name} by ${primaryArtists}`,
				images: album.image.length > 0 ? [album.image[0].url] : [],
			},
		};
	} catch (_error) {
		return {
			title: "Album Not Found",
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
