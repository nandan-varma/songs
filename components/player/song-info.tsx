"use client";

import Link from "next/link";
import { memo } from "react";
import { EntityType, type DetailedSong } from "@/lib/types";
import { ProgressiveImage } from "../progressive-image";

interface SongInfoProps {
	currentSong: DetailedSong;
}

export const SongInfo = memo(function SongInfo({ currentSong }: SongInfoProps) {
	return (
		<div className="flex items-center gap-4 min-w-0 w-72">
			{currentSong.image && currentSong.image.length > 0 && (
				<div className="relative h-16 w-16 flex-shrink-0">
					<ProgressiveImage
						images={currentSong.image}
						alt={currentSong.name}
						entityType={EntityType.SONG}
						rounded="default"
						priority
					/>
				</div>
			)}
			<div className="min-w-0 flex-1">
				<Link
					href={`/songs/${currentSong.id}`}
					className="font-semibold truncate text-base hover:underline block"
				>
					{currentSong.name}
				</Link>
				<div className="text-sm text-muted-foreground truncate">
					{currentSong.artists?.primary?.map((artist, index) => (
						<span key={artist.id}>
							<Link href={`/artists/${artist.id}`} className="hover:underline">
								{artist.name}
							</Link>
							{index < currentSong.artists.primary.length - 1 && ", "}
						</span>
					))}
				</div>
			</div>
		</div>
	);
});
