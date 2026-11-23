"use client";

import { ListMusic, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import { SongList } from "@/components/song-list";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/lib/stores/library";

const TABS = ["Favorites", "Playlists", "History"] as const;
type Tab = (typeof TABS)[number];

export default function LibraryPage() {
	const [tab, setTab] = useState<Tab>("Favorites");

	return (
		<div className="space-y-8">
			<fieldset className="flex min-w-0 gap-2 overflow-x-auto">
				<legend className="sr-only">Library section</legend>
				{TABS.map((name) => (
					<Button
						key={name}
						variant="chip"
						size="sm"
						data-active={tab === name}
						aria-pressed={tab === name}
						onClick={() => setTab(name)}
					>
						{name}
					</Button>
				))}
			</fieldset>
			{tab === "Favorites" && <Favorites />}
			{tab === "Playlists" && <Playlists />}
			{tab === "History" && <History />}
		</div>
	);
}

function Favorites() {
	const favorites = useLibrary((s) => s.favorites);
	if (favorites.length === 0) {
		return (
			<EmptyState
				title="No favorites yet"
				hint="Tap the heart on any song to keep it here."
			/>
		);
	}
	return <SongList tracks={favorites} />;
}

function History() {
	const history = useLibrary((s) => s.history);
	const clearHistory = useLibrary((s) => s.clearHistory);
	if (history.length === 0) {
		return (
			<EmptyState
				title="Nothing played yet"
				hint="Songs you play will show up here."
			/>
		);
	}
	return (
		<div className="space-y-2">
			<Button variant="ghost" size="sm" onClick={clearHistory}>
				<Trash2 /> Clear history
			</Button>
			<SongList tracks={history} />
		</div>
	);
}

function Playlists() {
	const playlists = useLibrary((s) => s.playlists);
	const [creating, setCreating] = useState(false);
	return (
		<div className="space-y-4">
			<Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
				<Plus /> New playlist
			</Button>
			<CreatePlaylistDialog open={creating} onOpenChange={setCreating} />
			{playlists.length === 0 ? (
				<EmptyState
					title="No playlists yet"
					hint="Create one, then add songs from any song menu."
				/>
			) : (
				<ul className="grid gap-2 sm:grid-cols-2">
					{playlists.map((playlist) => (
						<li key={playlist.id}>
							<Link
								href={`/library/${playlist.id}`}
								className="flex min-h-14 items-center gap-3 rounded-md border bg-card p-3 transition-colors duration-150 hover:bg-accent"
							>
								<ListMusic className="size-5 text-muted-foreground" />
								<span className="min-w-0">
									<span className="block truncate font-medium">
										{playlist.name}
									</span>
									<span className="text-xs text-muted-foreground">
										{playlist.tracks.length} songs
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
