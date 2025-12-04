"use client";

import { ListMusic } from "lucide-react";
import Link from "next/link";
import { EntityType, type Playlist } from "@/lib/types";
import { ProgressiveImage } from "./progressive-image";
import { Card, CardContent } from "./ui/card";

interface PlaylistsListProps {
	playlists: Playlist[];
}

export function PlaylistsList({ playlists }: PlaylistsListProps) {
	if (playlists.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			<h2 className="text-2xl font-semibold">Playlists</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{playlists.map((playlist) => (
					<Link key={playlist.id} href={`/playlists/${playlist.id}`}>
						<Card className="overflow-hidden hover:bg-accent/50 transition-colors">
							<CardContent className="p-4">
								<div className="space-y-3">
									<div className="relative aspect-square w-full">
										{playlist.image && playlist.image.length > 0 ? (
											<ProgressiveImage
												images={playlist.image}
												alt={playlist.title}
												entityType={EntityType.PLAYLIST}
												rounded="default"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-muted rounded">
												<ListMusic className="h-12 w-12 text-muted-foreground" />
											</div>
										)}
									</div>
									<div className="space-y-1">
										<h3 className="font-medium truncate">{playlist.title}</h3>
										<p className="text-sm text-muted-foreground truncate">
											{playlist.description}
										</p>
										<p className="text-xs text-muted-foreground capitalize">
											{playlist.language}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
