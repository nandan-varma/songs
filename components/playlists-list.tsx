"use client";

import { motion } from "motion/react";
import { ListMusic } from "lucide-react";
import Link from "next/link";
import { EntityType, type Playlist } from "@/types/entity";
import { ProgressiveImage } from "./common/progressive-image";
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
			<motion.h2
				className="text-2xl font-semibold"
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				Playlists
			</motion.h2>
			<motion.div
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				initial="hidden"
				animate="show"
				transition={{ staggerChildren: 0.05 }}
			>
				{playlists.map((playlist) => (
					<motion.div
						key={playlist.id}
						variants={{
							hidden: { opacity: 0, scale: 0.95 },
							show: { opacity: 1, scale: 1 },
						}}
					>
						<Link href={`/playlist?id=${playlist.id}`}>
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
					</motion.div>
				))}
			</motion.div>
		</div>
	);
}
