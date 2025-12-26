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
			openGraph: {
				title: `${artist.name} - Artist`,
				description: bio,
				type: "profile",
				images: artist.image.length > 0 ? [artist.image[0].url] : [],
			},
			twitter: {
				card: "summary_large_image",
				title: `${artist.name} - Artist`,
				description: bio,
				images: artist.image.length > 0 ? [artist.image[0].url] : [],
			},
		};
	} catch (_error) {
		return {
			title: "Artist Not Found",
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
