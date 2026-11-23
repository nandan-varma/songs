"use client";

import { shuffle } from "es-toolkit";
import { Pencil, Play, Shuffle } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { PlaylistEditDialog } from "@/components/common/playlist-edit-dialog";
import { SongsList } from "@/components/songs-list";
import { Button } from "@/components/ui/button";
import { useAppStore, usePlaylists } from "@/hooks/use-store";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";

export default function LocalPlaylistPage() {
	const [id] = useQueryState("id");
	const { playlists } = usePlaylists();
	const isHydrated = useStoreHydrated();
	const [isEditing, setIsEditing] = useState(false);

	if (!isHydrated) return null;

	const playlist = playlists.find((candidate) => candidate.id === id);
	if (!playlist) {
		return (
			<p className="container mx-auto px-4 py-8 text-center text-destructive">
				Playlist not found
			</p>
		);
	}

	const { songs } = playlist;
	const { playQueue } = useAppStore.getState();

	return (
		<div className="container mx-auto max-w-4xl space-y-6 px-4 py-6 pb-32">
			<div className="space-y-1">
				<h1 className="text-3xl font-bold">{playlist.name}</h1>
				<p className="text-muted-foreground">
					{songs.length} {songs.length === 1 ? "song" : "songs"}
				</p>
			</div>

			<div className="flex gap-2">
				<Button
					onClick={() => playQueue(songs)}
					disabled={songs.length === 0}
					className="gap-1.5"
				>
					<Play className="h-4 w-4" />
					Play
				</Button>
				<Button
					variant="secondary"
					onClick={() => playQueue(shuffle(songs))}
					disabled={songs.length === 0}
					className="gap-1.5"
				>
					<Shuffle className="h-4 w-4" />
					Shuffle
				</Button>
				<Button
					variant="outline"
					onClick={() => setIsEditing(true)}
					className="gap-1.5"
				>
					<Pencil className="h-4 w-4" />
					Edit
				</Button>
			</div>

			<SongsList
				songs={songs}
				numbered
				emptyMessage="This playlist is empty. Add songs from the menu on any song."
			/>

			{isEditing && (
				<PlaylistEditDialog
					playlistId={playlist.id}
					open
					onOpenChange={setIsEditing}
				/>
			)}
		</div>
	);
}
