"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Track } from "@/lib/models";
import { useLibrary } from "@/lib/stores/library";

interface CreatePlaylistDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	firstTrack?: Track;
}

export function CreatePlaylistDialog({
	open,
	onOpenChange,
	firstTrack,
}: CreatePlaylistDialogProps) {
	const createPlaylist = useLibrary((s) => s.createPlaylist);
	const [name, setName] = useState("");

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		createPlaylist(trimmed, firstTrack);
		toast.success(`Created ${trimmed}`);
		setName("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogTitle>New playlist</DialogTitle>
				<DialogDescription className="sr-only">
					Name your playlist.
				</DialogDescription>
				<form onSubmit={submit} className="grid gap-4">
					<Input
						autoFocus
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Playlist name"
						aria-label="Playlist name"
					/>
					<Button type="submit" disabled={!name.trim()}>
						Create
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
