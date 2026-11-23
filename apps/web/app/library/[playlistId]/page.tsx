"use client";

import { Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PlayButtons } from "@/components/play-buttons";
import { SongList } from "@/components/song-list";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useLibrary, useLibraryHydrated } from "@/lib/stores/library";

export default function LocalPlaylistPage() {
	const { playlistId } = useParams<{ playlistId: string }>();
	const router = useRouter();
	const hydrated = useLibraryHydrated();
	const playlist = useLibrary((s) =>
		s.playlists.find((p) => p.id === playlistId),
	);
	const deletePlaylist = useLibrary((s) => s.deletePlaylist);
	const removeFromPlaylist = useLibrary((s) => s.removeFromPlaylist);

	if (!hydrated) return null;
	if (!playlist) return <EmptyState title="Playlist not found" />;

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">{playlist.name}</h1>
					<p className="text-sm text-muted-foreground">
						{playlist.tracks.length} songs
					</p>
				</div>
				<div className="flex gap-2">
					<PlayButtons tracks={playlist.tracks} />
					<Button
						variant="ghost"
						size="icon"
						aria-label="Delete playlist"
						onClick={() => {
							deletePlaylist(playlist.id);
							router.replace("/library");
						}}
					>
						<Trash2 />
					</Button>
				</div>
			</div>
			{playlist.tracks.length === 0 ? (
				<EmptyState
					title="This playlist is empty"
					hint="Add songs from any song menu."
				/>
			) : (
				<SongList
					tracks={playlist.tracks}
					trailing={(track) => (
						<Button
							variant="ghost"
							size="icon"
							aria-label={`Remove ${track.title}`}
							onClick={() => removeFromPlaylist(playlist.id, track.id)}
						>
							<X />
						</Button>
					)}
				/>
			)}
		</div>
	);
}
