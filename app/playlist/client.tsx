"use client";

import { Play, Plus } from "lucide-react";
import { useQueryState } from "nuqs";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { QueryParamDetailShell } from "@/components/entity/query-param-detail-shell";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlaylist } from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { detailedSongToSong } from "@/lib/utils";
import { EntityType } from "@/types/entity";
import { PlaylistPageLoading } from "./loading";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue, addToQueue } = useOfflinePlayerActions();
	const isOffline = useIsOffline();

	const {
		data: playlist,
		error,
		isPending,
	} = usePlaylist(id || "", {
		enabled: !!id && !isOffline,
	});

	const filteredSongs = playlist?.songs ?? [];

	return (
		<QueryParamDetailShell
			id={id}
			entityLabel="playlist"
			isOffline={isOffline}
			isPending={isPending}
			error={error}
			hasData={!!playlist}
			loadingFallback={<PlaylistPageLoading />}
		>
			{playlist && (
				<div className="container mx-auto space-y-8 px-4 py-8 pb-32">
					<Card>
						<CardContent className="p-6">
							<div className="flex flex-col gap-6 md:flex-row">
								<div className="relative aspect-square w-full flex-shrink-0 md:w-64">
									<ProgressiveImage
										images={playlist.image}
										alt={playlist.name}
										entityType={EntityType.PLAYLIST}
										rounded="default"
										priority
										sizes="(max-width: 768px) 100vw, 256px"
									/>
								</div>

								<div className="flex-1 space-y-4">
									<div>
										<Badge variant="secondary" className="mb-2">
											Playlist
										</Badge>
										<h1 className="text-4xl font-bold">{playlist.name}</h1>
									</div>

									<div className="flex gap-4 text-sm text-muted-foreground">
										{playlist.year && <span>{playlist.year}</span>}
										{playlist.language && (
											<span className="capitalize">{playlist.language}</span>
										)}
										{playlist.songCount && (
											<span>{playlist.songCount} songs</span>
										)}
									</div>

									{playlist.description && (
										<p className="text-sm text-muted-foreground">
											{playlist.description}
										</p>
									)}

									<div className="flex gap-2">
										<Button
											size="lg"
											onClick={() => playQueue(filteredSongs)}
											className="gap-2"
											disabled={filteredSongs.length === 0}
										>
											<Play className="h-5 w-5" />
											Play All
										</Button>
										<Button
											size="lg"
											variant="outline"
											onClick={() => {
												for (const song of filteredSongs) {
													addToQueue(song);
												}
											}}
											className="gap-2"
											disabled={filteredSongs.length === 0}
										>
											<Plus className="h-5 w-5" />
											Add All to Queue
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{filteredSongs.length > 0 && (
						<SongsList songs={filteredSongs.map(detailedSongToSong)} />
					)}
				</div>
			)}
		</QueryParamDetailShell>
	);
}
