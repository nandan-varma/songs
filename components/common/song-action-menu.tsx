"use client";

import { Heart, ListPlus, Loader2, MoreHorizontal, Play } from "lucide-react";
import * as React from "react";
import { useDetailedSong } from "@/hooks/data/use-detailed-song";
import { useSongActions } from "@/hooks/player/use-song-actions";
import { songToDetailedSong } from "@/lib/utils";
import type { Song } from "@/types/entity";
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
	song: Song;
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
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);

	// Fetch detailed song when menu opens
	const { data: detailedSongArray, isPending } = useDetailedSong(
		isMenuOpen ? song.id : null,
	);

	const {
		handlePlay,
		handlePlayNext,
		handleAddToQueue,
		handleToggleFavorite,
		handleAddToPlaylist,
		playlists,
		isFavorite,
	} = useSongActions();

	// Get detailed song, falling back to basic info
	const detailedSong = React.useMemo(() => {
		if (detailedSongArray?.[0]) return detailedSongArray[0];
		return songToDetailedSong(song);
	}, [detailedSongArray, song]);

	const isFav = isFavorite(song.id);

	const handleOpen = (open: boolean) => {
		setIsMenuOpen(open);
	};

	return (
		<DropdownMenu open={isMenuOpen} onOpenChange={handleOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					{isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<MoreHorizontal className="h-4 w-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel>{song.title}</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					{onPlay && (
						<DropdownMenuItem onClick={() => handlePlay(detailedSong, onPlay)}>
							<Play className="mr-2 h-4 w-4" />
							Play
						</DropdownMenuItem>
					)}

					{showPlayNext && (
						<DropdownMenuItem onClick={() => handlePlayNext(detailedSong)}>
							<Play className="mr-2 h-4 w-4" />
							Play Next
						</DropdownMenuItem>
					)}

					{showAddToQueue && (
						<DropdownMenuItem onClick={() => handleAddToQueue(detailedSong)}>
							<ListPlus className="mr-2 h-4 w-4" />
							Add to Queue
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={() => handleToggleFavorite(detailedSong.id)}>
					<Heart
						className={`mr-2 h-4 w-4 ${
							isFav ? "fill-red-500 text-red-500" : ""
						}`}
					/>
					{isFav ? "Remove from Favorites" : "Add to Favorites"}
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
									checked={playlist.songs.some((s) => s.id === detailedSong.id)}
									onCheckedChange={() =>
										handleAddToPlaylist(playlist.id, detailedSong)
									}
								>
									{playlist.name}
								</DropdownMenuCheckboxItem>
							))
						) : (
							<DropdownMenuItem disabled>No playlists yet</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<CreatePlaylistDialog
							song={detailedSong}
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
