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
		};
	} catch (_error) {
		return {
			title: "Album Not Found",
		};
	}
}

async function AlbumPage({ id }: { id: string }) {
	const album = await getAlbum(id);

	return <Client album={album} />;
}

export default function Page({ searchParams }: Props) {
	return (
		<ErrorBoundary>
			<AlbumPageContent searchParams={searchParams} />
		</ErrorBoundary>
	);
}

async function AlbumPageContent({ searchParams }: Props) {
	const id = (await searchParams).id;

	if (!id || typeof id !== "string") {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Album ID is required</p>
			</div>
		);
	}

	return <AlbumPage id={id} />;
}
