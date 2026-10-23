"use client";

import { Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { CoverImage } from "@/components/common/cover-image";
import { FavoriteButton } from "@/components/common/favorite-button";
import { SongLyrics } from "@/components/song/song-lyrics";
import { SongsList } from "@/components/songs-list";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	useCurrentSong,
	useIsPlaying,
	useQueueLength,
	useQueueSongs,
	useVolume,
} from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";
import { PlaybackControls } from "./playback-controls";
import { ProgressBar } from "./progress-bar";
import { SleepTimerMenu } from "./sleep-timer-menu";
import { VolumeControl } from "./volume-control";

/** Blurred, darkened artwork that tints the whole screen and crossfades between songs. */
function Backdrop({ songId, imageUrl }: { songId: string; imageUrl?: string }) {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background">
			<AnimatePresence>
				<motion.div
					key={songId}
					className="absolute inset-0 scale-125 bg-cover bg-center blur-3xl"
					style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.8 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.8 }}
				/>
			</AnimatePresence>
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
		</div>
	);
}

/** Full-screen view of the current song: artwork, controls, volume, queue and lyrics. */
export function NowPlayingSheet({ children }: { children?: React.ReactNode }) {
	const song = useCurrentSong();
	const isPlaying = useIsPlaying();
	const queueLength = useQueueLength();
	const queue = useQueueSongs();
	const volume = useVolume();

	if (!song) return null;

	const { togglePlayPause, playPrevious, playNext, setSongTime, setVolume } =
		useAppStore.getState();

	return (
		<Sheet>
			<SheetTrigger asChild>
				{children ?? (
					<Button variant="ghost" size="icon" aria-label="Open now playing">
						<Maximize2 className="h-4 w-4" />
					</Button>
				)}
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="h-dvh gap-0 overflow-hidden border-0 bg-transparent p-0"
			>
				<Backdrop songId={song.id} imageUrl={song.image.at(-1)?.url} />
				<SheetTitle className="sr-only">Now playing: {song.name}</SheetTitle>
				<SheetDescription className="sr-only">
					Artwork, playback controls, queue and lyrics for the current song.
				</SheetDescription>

				<p className="pt-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Now playing
				</p>

				<div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-6 overflow-y-auto px-6 py-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:overflow-hidden">
					<div className="mx-auto w-full max-w-sm space-y-6 lg:max-w-none">
						<motion.div
							className="relative mx-auto aspect-square w-[min(100%,40dvh)] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:w-full"
							animate={{ scale: isPlaying ? 1 : 0.9 }}
							transition={{ type: "spring", stiffness: 220, damping: 24 }}
						>
							<AnimatePresence mode="popLayout">
								<motion.div
									key={song.id}
									className="absolute inset-0"
									initial={{ opacity: 0, scale: 1.05 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.4 }}
								>
									<CoverImage
										images={song.image}
										alt={song.name}
										priority
										rounded="none"
										sizes="(max-width: 1024px) 90vw, 416px"
									/>
								</motion.div>
							</AnimatePresence>
						</motion.div>

						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0">
								<Link
									href={`/song?id=${song.id}`}
									className="block truncate text-2xl font-bold hover:underline"
								>
									{song.name}
								</Link>
								<p className="truncate text-muted-foreground">
									{song.artists.primary.map((artist, index) => (
										<span key={artist.id}>
											{index > 0 && ", "}
											<Link
												href={`/artist?id=${artist.id}`}
												className="hover:underline"
											>
												{artist.name}
											</Link>
										</span>
									))}
								</p>
							</div>
							<FavoriteButton song={song} />
						</div>

						<ProgressBar onSeekTo={setSongTime} />

						<div className="flex justify-center">
							<PlaybackControls
								isPlaying={isPlaying}
								queueLength={queueLength}
								onTogglePlayPause={togglePlayPause}
								onPlayPrevious={playPrevious}
								onPlayNext={playNext}
							/>
						</div>

						<div className="flex items-center justify-between gap-4">
							<SleepTimerMenu />
							<div className="w-40">
								<VolumeControl volume={volume} onSetVolume={setVolume} />
							</div>
						</div>
					</div>

					<Tabs
						defaultValue={song.hasLyrics ? "lyrics" : "queue"}
						className="flex min-h-0 flex-col gap-4 lg:h-[min(36rem,70dvh)]"
					>
						<TabsList className="w-fit">
							{song.hasLyrics && (
								<TabsTrigger value="lyrics">Lyrics</TabsTrigger>
							)}
							<TabsTrigger value="queue">Up next ({queueLength})</TabsTrigger>
						</TabsList>
						{song.hasLyrics && (
							<TabsContent value="lyrics" className="min-h-0 overflow-y-auto">
								<SongLyrics songId={song.id} capHeight={false} />
							</TabsContent>
						)}
						<TabsContent value="queue" className="min-h-0 overflow-y-auto">
							<SongsList songs={queue} compact emptyMessage="Nothing queued" />
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
