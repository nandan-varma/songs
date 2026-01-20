"use client";

import Link from "next/link";
import { memo } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { type DetailedSong, EntityType } from "@/types/entity";

interface SongInfoProps {
	currentSong: DetailedSong | null;
}

export const SongInfo = memo(function SongInfo({ currentSong }: SongInfoProps) {
	if (!currentSong) {
		return (
			<div className="flex items-center gap-4 min-w-0 w-72">
				<div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded flex items-center justify-center">
					<div className="h-8 w-8 bg-muted-foreground/20 rounded" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="font-semibold truncate text-base text-muted-foreground">
						No song playing
					</div>
					<div className="text-sm text-muted-foreground truncate">
						Select a song to play
					</div>
				</div>
			</div>
		);
	}

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
					href={`/song?id=${currentSong.id}`}
					className="font-semibold truncate text-base hover:underline block"
				>
					{currentSong.name}
				</Link>
				<div className="text-sm text-muted-foreground truncate">
					{currentSong.artists?.primary?.map((artist, index) => (
						<span key={artist.id}>
							<Link
								href={`/artist?id=${artist.id}`}
								className="hover:underline"
							>
								{artist.name}
							</Link>
							{index < (currentSong.artists.primary?.length ?? 0) - 1 && ", "}
						</span>
					))}
				</div>
			</div>
		</div>
	);
});
