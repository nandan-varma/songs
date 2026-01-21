"use client";

import { Heart, ListPlus, Loader2, MoreHorizontal, Play } from "lucide-react";
import * as React from "react";
import { useFavorites } from "@/contexts/favorites-context";
import { useLocalPlaylists } from "@/contexts/local-playlists-context";
import { useQueueActions } from "@/contexts/queue-context";
import { getSongById } from "@/lib/api";
import type { DetailedSong, Song } from "@/types/entity";
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
	const { isFavorite, toggleFavorite } = useFavorites();
	const { addSong, insertSongAt } = useQueueActions();
	const { playlists, addSongToPlaylist } = useLocalPlaylists();
	const [detailedSong, setDetailedSong] = React.useState<DetailedSong | null>(
		null,
	);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);

	const isFav = isFavorite(song.id);

	const loadDetailedSong = React.useCallback(async () => {
		if (detailedSong || isLoading) return;
		setIsLoading(true);
		try {
			const response = await getSongById(song.id);
			setDetailedSong(response.data[0]);
		} catch {
			// Silent error
		} finally {
			setIsLoading(false);
		}
	}, [song.id, detailedSong, isLoading]);

	const handleOpen = () => {
		loadDetailedSong();
	};

	const getDetailedSong = (): DetailedSong => {
		if (detailedSong) return detailedSong;
		return {
			id: song.id,
			name: song.title,
			type: "song",
			year: null,
			releaseDate: null,
			duration: null,
			label: null,
			explicitContent: false,
			playCount: null,
			language: song.language,
			hasLyrics: false,
			lyricsId: null,
			url: song.url,
			copyright: null,
			album: {
				id: null,
				name: song.album,
				url: null,
			},
			artists: {
				primary: [],
				featured: [],
				all: [],
			},
			image: song.image || [],
			downloadUrl: [],
		};
	};

	const currentSong = getDetailedSong();

	const handlePlay = () => {
		if (onPlay) {
			onPlay();
		}
	};

	const handlePlayNext = () => {
		insertSongAt(currentSong, 1);
	};

	const handleAddToQueue = () => {
		addSong(currentSong);
	};

	const handleAddToPlaylist = (playlistId: string) => {
		addSongToPlaylist(playlistId, currentSong);
	};

	return (
		<DropdownMenu
			open={isMenuOpen}
			onOpenChange={(open) => {
				setIsMenuOpen(open);
				if (open) handleOpen();
			}}
		>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					{isLoading ? (
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
						<DropdownMenuItem onClick={handlePlay}>
							<Play className="mr-2 h-4 w-4" />
							Play
						</DropdownMenuItem>
					)}

					{showPlayNext && (
						<DropdownMenuItem onClick={handlePlayNext}>
							<Play className="mr-2 h-4 w-4" />
							Play Next
						</DropdownMenuItem>
					)}

					{showAddToQueue && (
						<DropdownMenuItem onClick={handleAddToQueue}>
							<ListPlus className="mr-2 h-4 w-4" />
							Add to Queue
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={() => toggleFavorite(currentSong)}>
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
									checked={playlist.songs.some((s) => s.id === currentSong.id)}
									onCheckedChange={() => handleAddToPlaylist(playlist.id)}
								>
									{playlist.name}
								</DropdownMenuCheckboxItem>
							))
						) : (
							<DropdownMenuItem disabled>No playlists yet</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<CreatePlaylistDialog
							song={currentSong}
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
