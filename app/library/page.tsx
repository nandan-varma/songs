"use client";

import { Heart, History, Music, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PlaylistEditDialog } from "@/components/common/playlist-edit-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFavorites } from "@/contexts/favorites-context";
import { useHistory } from "@/contexts/history-context";
import { useLocalPlaylists } from "@/contexts/local-playlists-context";
import { useQueueActions } from "@/contexts/queue-context";
import type { DetailedSong } from "@/types/entity";

function LibrarySongItem({
	song,
	onClick,
}: {
	song: DetailedSong;
	onClick?: () => void;
}) {
	const artistNames = song.artists.all.map((a) => a.name).join(", ");

	return (
		<button
			type="button"
			className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group w-full text-left"
			onClick={onClick}
		>
			{song.image && song.image.length > 0 ? (
				<div className="relative h-10 w-10 flex-shrink-0">
					<Image
						src={song.image[0]?.url || song.image[1]?.url || ""}
						alt={song.name}
						fill
						sizes="40px"
						className="rounded object-cover"
					/>
				</div>
			) : (
				<div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
					<Music className="h-5 w-5 text-muted-foreground" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<p className="font-medium truncate">{song.name}</p>
				<p className="text-sm text-muted-foreground truncate">
					{artistNames || song.album?.name}
				</p>
			</div>
		</button>
	);
}

function LoadingCard({ title }: { title: string }) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="flex items-center gap-2">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center gap-3 p-2 animate-pulse">
							<div className="h-10 w-10 rounded bg-muted" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-3 w-1/2 rounded bg-muted" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default function LibraryPage() {
	const { playlists, deletePlaylist } = useLocalPlaylists();
	const { favorites } = useFavorites();
	const { history, clearHistory } = useHistory();
	const { addSongs, setCurrentIndex } = useQueueActions();
	const [isClient, setIsClient] = useState(false);
	const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<div className="container mx-auto py-6">
				<h1 className="text-3xl font-bold mb-6">Library</h1>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<LoadingCard title="Favorites" />
					<LoadingCard title="Recently Played" />
					<LoadingCard title="Playlists" />
				</div>
			</div>
		);
	}

	const recentlyPlayedSongs = history
		.filter((item) => item.type === "song")
		.map((item) => item.data as DetailedSong);

	const handlePlayRecentlyPlayed = (index: number) => {
		if (index >= 0 && index < recentlyPlayedSongs.length) {
			addSongs(recentlyPlayedSongs);
			setCurrentIndex(index);
		}
	};

	const handlePlayPlaylist = (playlistId: string) => {
		const playlist = playlists.find((p) => p.id === playlistId);
		if (playlist && playlist.songs.length > 0) {
			addSongs(playlist.songs);
			setCurrentIndex(0);
		}
	};

	return (
		<div className="container mx-auto py-6">
			<h1 className="text-3xl font-bold mb-6">Library</h1>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Heart className="h-5 w-5 fill-red-500 text-red-500" />
							Favorites
						</CardTitle>
						<span className="text-sm text-muted-foreground">
							{favorites.length} songs
						</span>
					</CardHeader>
					<CardContent>
						{favorites.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No favorites yet. Heart some songs to add them here.
							</p>
						) : (
							<ScrollArea className="h-[300px]">
								<div className="space-y-1">
									{favorites.slice(0, 10).map((song) => (
										<LibrarySongItem
											key={song.id}
											song={song}
											onClick={() => {
												addSongs(favorites);
												setCurrentIndex(
													favorites.findIndex((s) => s.id === song.id),
												);
											}}
										/>
									))}
									{favorites.length > 10 && (
										<p className="text-sm text-muted-foreground text-center py-2">
											And {favorites.length - 10} more...
										</p>
									)}
								</div>
							</ScrollArea>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<History className="h-5 w-5" />
							Recently Played
						</CardTitle>
						{recentlyPlayedSongs.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearHistory}
								aria-label="Clear history"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</CardHeader>
					<CardContent>
						{recentlyPlayedSongs.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No recently played songs yet.
							</p>
						) : (
							<ScrollArea className="h-[300px]">
								<div className="space-y-1">
									{recentlyPlayedSongs.slice(0, 10).map((song, index) => (
										<LibrarySongItem
											key={song.id}
											song={song}
											onClick={() => handlePlayRecentlyPlayed(index)}
										/>
									))}
									{recentlyPlayedSongs.length > 10 && (
										<p className="text-sm text-muted-foreground text-center py-2">
											And {recentlyPlayedSongs.length - 10} more...
										</p>
									)}
								</div>
							</ScrollArea>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Music className="h-5 w-5" />
							Playlists
						</CardTitle>
						<span className="text-sm text-muted-foreground">
							{playlists.length}
						</span>
					</CardHeader>
					<CardContent>
						{playlists.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No playlists yet. Create one from any song.
							</p>
						) : (
							<ScrollArea className="h-[300px]">
								<div className="space-y-2">
									{playlists.map((playlist) => (
										<div
											key={playlist.id}
											className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group"
										>
											<button
												type="button"
												onClick={() => handlePlayPlaylist(playlist.id)}
												className="flex-1 text-left"
											>
												<p className="font-medium">{playlist.name}</p>
												<p className="text-sm text-muted-foreground">
													{playlist.songs.length} songs
												</p>
											</button>
											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setEditingPlaylistId(playlist.id)}
													aria-label="Edit playlist"
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => deletePlaylist(playlist.id)}
													aria-label="Delete playlist"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
						)}
					</CardContent>
				</Card>
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
