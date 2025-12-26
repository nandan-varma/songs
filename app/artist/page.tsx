import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/error-boundary";
import { getArtist } from "@/lib/data";
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
			title: "Artist Not Found",
		};
	}

	try {
		const artist = await getArtist(id);
		const bio = artist.bio?.[0]?.text || `Listen to ${artist.name}'s music`;
		const followerCount = artist.followerCount
			? `${artist.followerCount.toLocaleString()} followers`
			: "";

		return {
			title: `${artist.name} - Artist`,
			description: `${bio}${followerCount ? `. ${followerCount}.` : ""}`,
		};
	} catch (_error) {
		return {
			title: "Artist Not Found",
		};
	}
}

async function ArtistPage({ id }: { id: string }) {
	const artist = await getArtist(id, {
		songCount: 20,
		albumCount: 20,
		sortBy: "popularity",
		sortOrder: "desc",
	});

	return <Client artist={artist} />;
}

export default function Page({ searchParams }: Props) {
	return (
		<ErrorBoundary>
			<ArtistPageContent searchParams={searchParams} />
		</ErrorBoundary>
	);
}

async function ArtistPageContent({ searchParams }: Props) {
	const id = (await searchParams).id;

	if (!id || typeof id !== "string") {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Artist ID is required</p>
			</div>
		);
	}

	return <ArtistPage id={id} />;
}
