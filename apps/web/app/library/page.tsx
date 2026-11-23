"use client";

import { ListMusic, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import { EmptyState } from "@/components/section";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/lib/stores/library";
import { cn } from "@/lib/utils";

const TABS = ["Favorites", "Playlists", "History"] as const;
type Tab = (typeof TABS)[number];

export default function LibraryPage() {
	const [tab, setTab] = useState<Tab>("Favorites");

	return (
		<div className="space-y-6">
			<div role="tablist" className="flex gap-2">
				{TABS.map((name) => (
					<Button
						key={name}
						role="tab"
						aria-selected={tab === name}
						variant={tab === name ? "default" : "secondary"}
						size="sm"
						onClick={() => setTab(name)}
					>
						{name}
					</Button>
				))}
			</div>
			{tab === "Favorites" && <Favorites />}
			{tab === "Playlists" && <Playlists />}
			{tab === "History" && <History />}
		</div>
	);
}

function Favorites() {
	const favorites = useLibrary((s) => s.favorites);
	if (favorites.length === 0) {
		return <EmptyState>Songs you favorite will show up here.</EmptyState>;
	}
	return <TrackList tracks={favorites} />;
}

function History() {
	const history = useLibrary((s) => s.history);
	const clearHistory = useLibrary((s) => s.clearHistory);
	if (history.length === 0) {
		return <EmptyState>Songs you play will show up here.</EmptyState>;
	}
	return (
		<div className="space-y-2">
			<Button variant="ghost" size="sm" onClick={clearHistory}>
				<Trash2 /> Clear history
			</Button>
			<TrackList tracks={history} />
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
				<EmptyState>No playlists yet.</EmptyState>
			) : (
				<ul className="grid gap-2 sm:grid-cols-2">
					{playlists.map((playlist) => (
						<li key={playlist.id}>
							<Link
								href={`/library/${playlist.id}`}
								className={cn(
									"flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent",
								)}
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
