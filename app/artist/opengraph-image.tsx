import { ImageResponse } from "next/og";

import { getArtist } from "@/lib/data";

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
		const artist = await getArtist(id);

		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
					🎤 Artist
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
					{artist.name}
				</div>
				{artist.followerCount && (
					<div
						style={{
							fontSize: 36,
							opacity: 0.8,
						}}
					>
						{artist.followerCount.toLocaleString()} followers
					</div>
				)}
			</div>,
		);
	} catch (_error) {
		return new ImageResponse(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "white",
				}}
			>
				🎤 Music App
			</div>,
		);
	}
}
