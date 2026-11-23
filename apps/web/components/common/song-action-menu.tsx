"use client";

import { Heart, ListPlus, MoreHorizontal, Play, Share2 } from "lucide-react";
import * as React from "react";
import { useSongActions } from "@/hooks/player/use-song-actions";
import type { DetailedSong } from "@/types/entity";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CreatePlaylistDialog } from "./create-playlist-dialog";

interface SongActionMenuProps {
	song: DetailedSong;
	showPlayNext?: boolean;
	showAddToQueue?: boolean;
	onPlay?: () => void;
}

export function SongActionMenu({
	song,
	showPlayNext = true,
	showAddToQueue = true,
	onPlay,
}: SongActionMenuProps) {
	const {
		handlePlay,
		handlePlayNext,
		handleAddToQueue,
		handleToggleFavorite,
		handleAddToPlaylist,
		playlists,
		isFavorite,
	} = useSongActions();

	const isFav = isFavorite(song.id);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel>{song.name}</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					{onPlay && (
						<DropdownMenuItem onClick={() => handlePlay(song, onPlay)}>
							<Play className="mr-2 h-4 w-4" />
							Play
						</DropdownMenuItem>
					)}

					{showPlayNext && (
						<DropdownMenuItem onClick={() => handlePlayNext(song)}>
							<Play className="mr-2 h-4 w-4" />
							Play Next
						</DropdownMenuItem>
					)}

					{showAddToQueue && (
						<DropdownMenuItem onClick={() => handleAddToQueue(song)}>
							<ListPlus className="mr-2 h-4 w-4" />
							Add to Queue
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={() => handleToggleFavorite(song.id)}>
					<Heart
						className={`mr-2 h-4 w-4 ${
							isFav ? "fill-red-500 text-red-500" : ""
						}`}
					/>
					{isFav ? "Remove from Favorites" : "Add to Favorites"}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={async () => {
						const shareUrl = `${window.location.origin}/song?id=${song.id}`;
						if (navigator.share) {
							try {
								await navigator.share({
									title: song.name,
									text: `Check out ${song.name}`,
									url: shareUrl,
								});
							} catch {
								await navigator.clipboard.writeText(shareUrl);
							}
						} else {
							await navigator.clipboard.writeText(shareUrl);
						}
					}}
				>
					<Share2 className="mr-2 h-4 w-4" />
					Share
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<ListPlus className="mr-2 h-4 w-4" />
						Add to Playlist
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{playlists.length > 0 ? (
							playlists.map((playlist) => (
								<DropdownMenuCheckboxItem
									key={playlist.id}
									checked={playlist.songs.some((s) => s.id === song.id)}
									onCheckedChange={() => handleAddToPlaylist(playlist.id, song)}
								>
									{playlist.name}
								</DropdownMenuCheckboxItem>
							))
						) : (
							<DropdownMenuItem disabled>No playlists yet</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<CreatePlaylistDialog
							song={song}
							trigger={
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
									}}
									className="flex items-center gap-2"
								>
									<ListPlus className="h-4 w-4" />
									Create New Playlist
								</DropdownMenuItem>
							}
						/>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
