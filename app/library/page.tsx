"use client";

import { useState } from "react";
import { PlaylistEditDialog } from "@/components/common/playlist-edit-dialog";
import { useAppStore, useHistory, usePlaylists } from "@/hooks/use-store";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import { LibraryLoadingGrid } from "./_components/LibraryLoadingGrid";
import { PlaylistsSection } from "./_components/PlaylistsSection";
import { RecentlyPlayedSection } from "./_components/RecentlyPlayedSection";

export default function LibraryPage() {
	const { playlists, deletePlaylist } = usePlaylists();
	const { playbackHistory, clearPlaybackHistory } = useHistory();
	const isHydrated = useStoreHydrated();
	const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(
		null,
	);

	if (!isHydrated) {
		return <LibraryLoadingGrid />;
	}

	const recentlyPlayedSongs = playbackHistory;

	const handlePlayRecentlyPlayed = (index: number) => {
		if (index >= 0 && index < recentlyPlayedSongs.length) {
			useAppStore.getState().playQueue(recentlyPlayedSongs, index);
		}
	};

	const handlePlayPlaylist = (playlistId: string) => {
		const playlist = playlists.find((p) => p.id === playlistId);
		if (playlist && playlist.songs.length > 0) {
			useAppStore.getState().playQueue(playlist.songs, 0);
		}
	};

	return (
		<div className="container mx-auto py-6 px-4 sm:px-6 max-w-7xl">
			<h1 className="text-3xl font-bold mb-6">Library</h1>

			<div className="grid gap-6 md:grid-cols-2 p-2">
				<RecentlyPlayedSection
					songs={recentlyPlayedSongs}
					onPlaySong={handlePlayRecentlyPlayed}
					onClear={clearPlaybackHistory}
				/>
				<PlaylistsSection
					playlists={playlists}
					onPlayPlaylist={handlePlayPlaylist}
					onEditPlaylist={setEditingPlaylistId}
					onDeletePlaylist={deletePlaylist}
				/>
			</div>

			{editingPlaylistId && (
				<PlaylistEditDialog
					playlistId={editingPlaylistId}
					open={true}
					onOpenChange={(open) => {
						if (!open) {
							setEditingPlaylistId(null);
						}
					}}
				/>
			)}
		</div>
	);
}
