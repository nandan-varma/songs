"use client";

import {
	Download,
	ListEnd,
	ListPlus,
	ListStart,
	MoreHorizontal,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadHref } from "@/lib/download";
import type { Track } from "@/lib/models";
import { useLibrary } from "@/lib/stores/library";
import { usePlayer } from "@/lib/stores/player";

export function TrackMenu({ track }: { track: Track }) {
	const playlists = useLibrary((s) => s.playlists);
	const addToPlaylist = useLibrary((s) => s.addToPlaylist);
	const [creating, setCreating] = useState(false);
	const { playNext, enqueue } = usePlayer.getState();

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" aria-label="Track options">
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem
						onSelect={() => {
							playNext(track);
							toast.success("Playing next");
						}}
					>
						<ListStart /> Play next
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							enqueue(track);
							toast.success("Added to queue");
						}}
					>
						<ListEnd /> Add to queue
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<ListPlus /> Add to playlist
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem onSelect={() => setCreating(true)}>
								<Plus /> New playlist
							</DropdownMenuItem>
							{playlists.map((playlist) => (
								<DropdownMenuItem
									key={playlist.id}
									onSelect={() => {
										addToPlaylist(playlist.id, track);
										toast.success(`Added to ${playlist.name}`);
									}}
								>
									{playlist.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					{track.album && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link href={`/album/${track.album.id}`}>Go to album</Link>
							</DropdownMenuItem>
						</>
					)}
					<DropdownMenuItem asChild>
						<a href={downloadHref(track)} download>
							<Download /> Download
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href={`/song/${track.id}`}>Song details</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<CreatePlaylistDialog
				open={creating}
				onOpenChange={setCreating}
				firstTrack={track}
			/>
		</>
	);
}
