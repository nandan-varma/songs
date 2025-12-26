import { ImageResponse } from "next/og";

import { getPlaylist } from "@/lib/data";

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
		const playlist = await getPlaylist(id);

		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
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
					📋 Playlist
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
					{playlist.name}
				</div>
				{playlist.songCount && (
					<div
						style={{
							fontSize: 36,
							opacity: 0.8,
						}}
					>
						{playlist.songCount} songs
					</div>
				)}
			</div>,
		);
	} catch (_error) {
		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "white",
				}}
			>
				📋 Music App
			</div>,
		);
	}
}
