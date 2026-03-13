"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useLocalPlaylists } from "@/contexts/local-playlists-context";
import type { DetailedSong } from "@/types/entity";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";

interface CreatePlaylistDialogProps {
	song: DetailedSong;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function CreatePlaylistDialog({
	song,
	trigger,
	open: controlledOpen,
	onOpenChange: setControlledOpen,
}: CreatePlaylistDialogProps) {
	const { createPlaylist, addSongToPlaylist } = useLocalPlaylists();
	const [playlistName, setPlaylistName] = React.useState("");
	const [isCreating, setIsCreating] = React.useState(false);
	const [internalOpen, setInternalOpen] = React.useState(false);

	const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
	const setIsOpen = setControlledOpen || setInternalOpen;

	const handleCreate = async () => {
		if (!playlistName.trim()) return;

		setIsCreating(true);
		const id = await createPlaylist(playlistName.trim());
		if (id) {
			addSongToPlaylist(id, song);
		}
		setIsCreating(false);
		setPlaylistName("");
		setIsOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleCreate();
		}
		if (e.key === "Escape") {
			setIsOpen(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setPlaylistName("");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Playlist</DialogTitle>
					<DialogDescription>
						Create a new playlist and add "{song.name}" to it.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Input
						placeholder="Playlist name"
						value={playlistName}
						onChange={(e) => setPlaylistName(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isCreating}
						autoFocus
					/>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={!playlistName.trim() || isCreating}
					>
						{isCreating ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Creating...
							</>
						) : (
							<>
								<Plus className="h-4 w-4 mr-2" />
								Create
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
