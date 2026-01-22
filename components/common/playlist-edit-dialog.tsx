"use client";

import { GripVertical, ListMusic, Minus, Play } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useLocalPlaylists } from "@/contexts/local-playlists-context";
import { useQueueActions } from "@/contexts/queue-context";
import type { DetailedSong } from "@/types/entity";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface PlaylistEditDialogProps {
	playlistId: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

interface SongItemProps {
	song: DetailedSong;
	index: number;
	onRemove: () => void;
	onPlay: () => void;
	onDragStart: (index: number) => void;
	onDragEnter: (index: number) => void;
	onDragEnd: () => void;
	isDragging: boolean;
}

function SongItem({
	song,
	index,
	onRemove,
	onPlay,
	onDragStart,
	onDragEnter,
	onDragEnd,
	isDragging,
}: SongItemProps) {
	const artistNames = song.artists.all.map((a) => a.name).join(", ");

	return (
		<div
			role="button"
			tabIndex={0}
			draggable
			onDragStart={(e) => {
				e.stopPropagation();
				onDragStart(index);
			}}
			onDragEnter={(e) => {
				e.stopPropagation();
				onDragEnter(index);
			}}
			onDragEnd={(e) => {
				e.stopPropagation();
				onDragEnd();
			}}
			onDragOver={(e) => {
				e.preventDefault();
			}}
			onClick={(e) => {
				e.stopPropagation();
			}}
			className={`flex items-center gap-3 p-2 rounded-lg border transition-all w-full text-left ${
				isDragging
					? "opacity-40 scale-95"
					: "hover:bg-accent/50 bg-background cursor-move"
			}`}
		>
			<div className="h-8 w-8 flex items-center justify-center text-muted-foreground">
				<GripVertical className="h-4 w-4" />
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={(e) => {
					e.stopPropagation();
					onPlay();
				}}
				aria-label="Play song"
			>
				<Play className="h-4 w-4" />
			</Button>
			<div className="relative h-10 w-10 shrink-0 rounded overflow-hidden">
				{song.image && song.image.length > 0 ? (
					<Image
						src={song.image[0]?.url || ""}
						alt={song.name}
						fill
						sizes="40px"
						className="object-cover"
					/>
				) : (
					<div className="h-full w-full bg-muted flex items-center justify-center">
						<ListMusic className="h-5 w-5 text-muted-foreground" />
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-medium text-sm truncate">{song.name}</p>
				<p className="text-xs text-muted-foreground truncate">
					{artistNames || song.album?.name}
				</p>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 text-muted-foreground hover:text-destructive"
				onClick={(e) => {
					e.stopPropagation();
					onRemove();
				}}
				aria-label="Remove song"
			>
				<Minus className="h-4 w-4" />
			</Button>
		</div>
	);
}

export function PlaylistEditDialog({
	playlistId,
	open: controlledOpen,
	onOpenChange: setControlledOpen,
}: PlaylistEditDialogProps) {
	const { playlists, removeSongFromPlaylist, reorderPlaylistSongs } =
		useLocalPlaylists();
	const { addSongs, setCurrentIndex } = useQueueActions();
	const [internalOpen, setInternalOpen] = React.useState(false);

	const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
	const setIsOpen = setControlledOpen || setInternalOpen;

	const playlist = playlists.find((p) => p.id === playlistId);
	const songs = playlist?.songs || [];

	const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

	const handleDragStart = (index: number) => {
		setDraggedIndex(index);
	};

	const handleDragEnter = (index: number) => {
		if (draggedIndex === null || draggedIndex === index) return;
		setDragOverIndex(index);
	};

	const handleDragEnd = () => {
		if (draggedIndex === null || dragOverIndex === null || !playlist) {
			setDraggedIndex(null);
			setDragOverIndex(null);
			return;
		}

		if (draggedIndex !== dragOverIndex) {
			reorderPlaylistSongs(playlist.id, draggedIndex, dragOverIndex);
		}

		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleRemove = (index: number) => {
		if (!playlist) return;
		const song = songs[index];
		if (song) {
			removeSongFromPlaylist(playlist.id, song.id);
		}
	};

	const handlePlay = (index: number) => {
		addSongs(songs);
		setCurrentIndex(index);
	};

	// Compute display order based on drag state
	const displaySongs = React.useMemo(() => {
		if (draggedIndex === null || dragOverIndex === null) {
			return songs;
		}

		const newSongs = [...songs];
		const [draggedSong] = newSongs.splice(draggedIndex, 1);
		if (!draggedSong) return songs;
		newSongs.splice(dragOverIndex, 0, draggedSong);
		return newSongs;
	}, [songs, draggedIndex, dragOverIndex]);

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
									<SongItem
										key={song.id}
										song={song}
										index={originalIndex}
										onRemove={() => handleRemove(originalIndex)}
										onPlay={() => handlePlay(originalIndex)}
										onDragStart={handleDragStart}
										onDragEnter={handleDragEnter}
										onDragEnd={handleDragEnd}
										isDragging={draggedIndex === originalIndex}
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
