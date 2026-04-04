import { Music, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LocalPlaylist } from "@/types/entity";

interface PlaylistsSectionProps {
	playlists: LocalPlaylist[];
	onPlayPlaylist: (playlistId: string) => void;
	onEditPlaylist: (playlistId: string) => void;
	onDeletePlaylist: (playlistId: string) => void;
}

export function PlaylistsSection({
	playlists,
	onPlayPlaylist,
	onEditPlaylist,
	onDeletePlaylist,
}: PlaylistsSectionProps) {
	return (
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
					<p className="text-sm text-muted-foreground">
						No playlists yet. Create one from any song.
					</p>
				) : (
					<ScrollArea className="h-[300px]">
						<div className="space-y-2">
							{playlists.map((playlist) => (
								<div
									key={playlist.id}
									className="group flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
								>
									<button
										type="button"
										onClick={() => onPlayPlaylist(playlist.id)}
										className="flex-1 text-left"
									>
										<p className="font-medium">{playlist.name}</p>
										<p className="text-sm text-muted-foreground">
											{playlist.songs.length} songs
										</p>
									</button>
									<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onEditPlaylist(playlist.id)}
											aria-label="Edit playlist"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onDeletePlaylist(playlist.id)}
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
	);
}
