import { ImageResponse } from "next/og";

import { getAlbum } from "@/lib/data";

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
		const album = await getAlbum(id);
		const primaryArtists = album.artists.primary
			.map((artist) => artist.name)
			.join(", ");

		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
					🎵 Album
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
					{album.name}
				</div>
				<div
					style={{
						fontSize: 48,
						opacity: 0.8,
					}}
				>
					by {primaryArtists}
				</div>
				{album.year && (
					<div
						style={{
							fontSize: 36,
							opacity: 0.7,
							marginTop: "20px",
						}}
					>
						{album.year}
					</div>
				)}
			</div>,
		);
	} catch (_error) {
		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
