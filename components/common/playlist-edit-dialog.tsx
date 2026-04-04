"use client";

import { ListMusic } from "lucide-react";
import * as React from "react";
import { useDragReorder } from "@/hooks/ui/use-drag-reorder";
import { usePlaylists } from "@/hooks/use-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { PlaylistSongItem } from "./playlist-song-item";

interface PlaylistEditDialogProps {
	playlistId: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog for editing playlist songs
 * Supports drag-and-drop reordering and removing songs
 */
export function PlaylistEditDialog({
	playlistId,
	open: controlledOpen,
	onOpenChange: setControlledOpen,
}: PlaylistEditDialogProps) {
	const { playlists, removeSongFromPlaylist } = usePlaylists();
	const [internalOpen, setInternalOpen] = React.useState(false);

	const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
	const setIsOpen = setControlledOpen || setInternalOpen;

	const playlist = playlists.find((p) => p.id === playlistId);
	const songs = playlist?.songs || [];

	const {
		displayItems: displaySongs,
		isDragging,
		handleDragStart,
		handleDragEnter,
		handleDragEnd,
	} = useDragReorder({
		items: songs,
		onReorder: (fromIndex, toIndex) => {
			// TODO: Implement reordering in the store if needed
			if (playlist) {
				// reorderPlaylistSongs(playlist.id, fromIndex, toIndex);
			}
		},
	});

	const handleRemove = (index: number) => {
		if (!playlist) return;
		const song = songs[index];
		if (song) {
			removeSongFromPlaylist(playlist.id, song.id);
		}
	};

	const handlePlay = (index: number) => {
		// TODO: Implement play from playlist dialog if needed
	};

	if (!playlist) {
		return null;
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
			}}
		>
			<DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle className="flex items-center gap-2 text-lg">
						<ListMusic className="h-5 w-5" />
						{playlist.name}
					</DialogTitle>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto">
					{songs.length === 0 ? (
						<div className="flex items-center justify-center h-48 text-muted-foreground">
							<p>Empty playlist</p>
						</div>
					) : (
						<div className="p-4 space-y-2">
							{displaySongs.map((song, _visualIndex) => {
								const originalIndex = songs.findIndex((s) => s.id === song.id);
								return (
									<PlaylistSongItem
										key={song.id}
										song={song}
										index={originalIndex}
										isDragging={isDragging(originalIndex)}
										onRemove={() => handleRemove(originalIndex)}
										onPlay={() => handlePlay(originalIndex)}
										onDragStart={handleDragStart}
										onDragEnter={handleDragEnter}
										onDragEnd={handleDragEnd}
									/>
								);
							})}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
