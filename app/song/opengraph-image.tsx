import { ImageResponse } from "next/og";

import { getSong } from "@/lib/data";

export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	try {
		const songs = await getSong(id);
		const song = songs[0];

		if (!song) {
			throw new Error("Song not found");
		}

		const primaryArtists = song.artists.primary
			.map((artist) => artist.name)
			.join(", ");

		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					color: "white",
					padding: "40px",
					textAlign: "center",
				}}
			>
				<div
					style={{
						fontSize: 48,
						fontWeight: "bold",
						marginBottom: "20px",
						opacity: 0.9,
					}}
				>
					🎵 Song
				</div>
				<div
					style={{
						fontSize: 72,
						fontWeight: "bold",
						marginBottom: "20px",
						maxWidth: "800px",
						lineHeight: 1.2,
					}}
				>
					{song.name}
				</div>
				<div
					style={{
						fontSize: 48,
						opacity: 0.8,
						marginBottom: "10px",
					}}
				>
					by {primaryArtists}
				</div>
				<div
					style={{
						fontSize: 36,
						opacity: 0.7,
					}}
				>
					from {song.album.name}
				</div>
			</div>,
		);
	} catch (_error) {
		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "white",
				}}
			>
				🎵 Music App
			</div>,
		);
	}
}
