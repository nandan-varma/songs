"use client";

import { Loader2, Music, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { DownloadButton } from "@/components/download-button";
import { ProgressiveImage } from "@/components/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { useSong, useSongSuggestions } from "@/hooks/queries";
import { useOfflinePlayerActions } from "@/hooks/use-offline-player";
import { EntityType } from "@/lib/types";
import { detailedSongToSong } from "@/lib/utils";

export default function SongPage() {
	const params = useParams();
	const songId = params.id as string;
	const { playSong, addToQueue } = useOfflinePlayerActions();
	const { getFilteredSongs, shouldEnableQuery, isOfflineMode } = useOffline();
	const { addToHistory } = useHistory();

	const {
		data: songData,
		isLoading: isSongLoading,
		error: songError,
	} = useSong(songId, {
		enabled: shouldEnableQuery(),
	});
	const { data: suggestions = [], isLoading: isSuggestionsLoading } =
		useSongSuggestions(songId, 10, {
			enabled: shouldEnableQuery(),
		});

	const song = songData?.[0];
	const filteredSuggestions = getFilteredSongs(suggestions);
	const isLoading = isSongLoading || isSuggestionsLoading;

	// Add to history when song loads
	useEffect(() => {
		if (song) {
			addToHistory({
				id: song.id,
				type: EntityType.SONG,
				data: song,
				timestamp: new Date(),
			});
		}
	}, [song, addToHistory]);

	if (isOfflineMode) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Song details are not available in offline mode. Please disable
							offline mode to view this song.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (songError || !song) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">
					{songError instanceof Error ? songError.message : "Song not found"}
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			{/* Song Header */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Album Art */}
						<div className="w-full md:w-64 flex-shrink-0">
							{song.image && song.image.length > 0 ? (
								<ProgressiveImage
									images={song.image}
									alt={song.name}
									entityType={EntityType.SONG}
									rounded="default"
									priority
									objectFit="contain"
									fill={false}
									width={256}
									height={256}
								/>
							) : (
								<div className="flex aspect-square h-full w-full items-center justify-center bg-muted rounded-lg">
									<Music className="h-24 w-24 text-muted-foreground" />
								</div>
							)}
						</div>

						{/* Song Details */}
						<div className="flex-1 space-y-4">
							<div>
								<Badge variant="secondary" className="mb-2">
									Song
								</Badge>
								<h1 className="text-4xl font-bold">{song.name}</h1>
							</div>

							<div className="space-y-2">
								<div>
									<span className="text-sm text-muted-foreground">
										Artists:{" "}
									</span>
									{song.artists?.primary?.map((artist, index) => (
										<span key={artist.id}>
											<Link
												href={`/artists/${artist.id}`}
												className="text-sm hover:underline"
											>
												{artist.name}
											</Link>
											{index < song.artists.primary.length - 1 && ", "}
										</span>
									))}
								</div>

								{song.album?.name && (
									<div>
										<span className="text-sm text-muted-foreground">
											Album:{" "}
										</span>
										{song.album.id ? (
											<Link
												href={`/albums/${song.album.id}`}
												className="text-sm hover:underline"
											>
												{song.album.name}
											</Link>
										) : (
											<span className="text-sm">{song.album.name}</span>
										)}
									</div>
								)}

								<div className="flex gap-4 text-sm text-muted-foreground">
									{song.year && <span>{song.year}</span>}
									{song.language && (
										<span className="capitalize">{song.language}</span>
									)}
									{song.duration && (
										<span>
											{Math.floor(song.duration / 60)}:
											{(song.duration % 60).toString().padStart(2, "0")}
										</span>
									)}
								</div>

								{song.hasLyrics && (
									<Badge variant="outline">Lyrics Available</Badge>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2">
								<Button
									size="lg"
									onClick={() => {
										playSong(song);
									}}
									className="gap-2"
								>
									<Play className="h-5 w-5" />
									Play
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={() => {
										addToQueue(song);
									}}
									className="gap-2"
								>
									<Plus className="h-5 w-5" />
									Add to Queue
								</Button>
								<DownloadButton song={song} size="lg" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Suggestions */}
			{filteredSuggestions.length > 0 && (
				<>
					<Separator />
					<div className="space-y-4">
						<h2 className="text-2xl font-semibold">You Might Also Like</h2>
						<SongsList songs={filteredSuggestions.map(detailedSongToSong)} />
					</div>
				</>
			)}
		</div>
	);
}
