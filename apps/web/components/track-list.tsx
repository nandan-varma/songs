"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { FavoriteButton } from "@/components/favorite-button";
import { TrackMenu } from "@/components/track-menu";
import type { Track } from "@/lib/models";
import { selectCurrentTrack, usePlayer } from "@/lib/stores/player";
import { cn, formatTime } from "@/lib/utils";

export function ArtistLinks({
	artists,
	className,
}: {
	artists: Track["artists"];
	className?: string;
}) {
	return (
		<span className={cn("truncate", className)}>
			{artists.map((artist, i) => (
				<span key={artist.id}>
					{i > 0 && ", "}
					<Link href={`/artist/${artist.id}`} className="hover:underline">
						{artist.name}
					</Link>
				</span>
			))}
		</span>
	);
}

interface TrackListProps {
	tracks: Track[];
	/** Rendered in place of the favorite button, e.g. a remove action. */
	trailing?: (track: Track) => React.ReactNode;
}

/** Clicking a row plays the whole list starting there. */
export function TrackList({ tracks, trailing }: TrackListProps) {
	const currentId = usePlayer((s) => selectCurrentTrack(s)?.id);
	const playing = usePlayer((s) => s.playing);
	const { play, toggle } = usePlayer.getState();

	return (
		<ul className="divide-y divide-border/50">
			{tracks.map((track, index) => {
				const active = track.id === currentId;
				return (
					<li key={track.id} className="flex items-center gap-1 py-2">
						<button
							type="button"
							onClick={() => (active ? toggle() : play(tracks, index))}
							aria-label={`${active && playing ? "Pause" : "Play"} ${track.title}`}
							className="group relative size-12 shrink-0"
						>
							<Cover src={track.image} alt="" sizes="48px" />
							<span
								className={cn(
									"absolute inset-0 flex items-center justify-center rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
									active && "opacity-100",
								)}
							>
								{active && playing ? (
									<Pause className="size-5" />
								) : (
									<Play className="size-5" />
								)}
							</span>
						</button>
						<div className="mx-2 min-w-0 flex-1">
							<p
								className={cn(
									"truncate text-sm font-medium",
									active && "text-primary",
								)}
							>
								{track.title}
							</p>
							<ArtistLinks
								artists={track.artists}
								className="block text-xs text-muted-foreground"
							/>
						</div>
						<span className="hidden text-xs text-muted-foreground tabular-nums sm:block">
							{formatTime(track.duration)}
						</span>
						{trailing ? trailing(track) : <FavoriteButton track={track} />}
						<TrackMenu track={track} />
					</li>
				);
			})}
		</ul>
	);
}
