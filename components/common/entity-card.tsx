"use client";

import Link from "next/link";
import { memo } from "react";
import { CardPlayButton } from "@/components/common/card-play-button";
import { CoverImage } from "@/components/common/cover-image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Image } from "@/types/entity";

export type EntityKind = "album" | "playlist" | "artist";

export interface EntityItem {
	id: string;
	name: string;
	/** One line under the name, e.g. artists, year or song count. */
	subtitle?: string;
	image: Image[];
}

const ROUTES = {
	album: "/album",
	playlist: "/playlist",
	artist: "/artist",
} as const;

interface EntityCardProps {
	kind: EntityKind;
	item: EntityItem;
	isLoading: boolean;
	onPlay: () => void;
	onShuffle?: () => void;
}

/**
 * Cover, name and one subtitle line. Both text lines are fixed to a single line height,
 * so every card in a row is the same height whatever the text.
 */
export const EntityCard = memo(function EntityCard({
	kind,
	item,
	isLoading,
	onPlay,
	onShuffle,
}: EntityCardProps) {
	const isArtist = kind === "artist";

	return (
		<Card className="group h-full gap-0 overflow-hidden py-2 transition-all duration-200 hover:bg-accent/60 hover:shadow-lg hover:ring-1 hover:ring-primary/30">
			<CardContent className="p-2">
				<Link
					href={{ pathname: ROUTES[kind], query: { id: item.id } }}
					className="block"
				>
					<div className="relative aspect-square w-full">
						<CoverImage
							images={item.image}
							alt={item.name}
							rounded={isArtist ? "full" : "default"}
							sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw"
						/>
						<CardPlayButton
							onPlay={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onPlay();
							}}
							onShuffle={
								onShuffle &&
								((event) => {
									event.preventDefault();
									event.stopPropagation();
									onShuffle();
								})
							}
							isLoading={isLoading}
						/>
					</div>
					<div className={cn("mt-2", isArtist && "text-center")}>
						<h3 className="h-5 truncate text-xs font-medium sm:text-sm">
							{item.name}
						</h3>
						<p className="h-4 truncate text-[10px] text-muted-foreground sm:text-xs">
							{item.subtitle}
						</p>
					</div>
				</Link>
			</CardContent>
		</Card>
	);
});

export function EntityCardSkeleton({ kind }: { kind: EntityKind }) {
	return (
		<Card className="gap-0 overflow-hidden bg-accent/20 py-2">
			<CardContent className="space-y-2 p-2">
				<Skeleton
					className={cn(
						"aspect-square w-full",
						kind === "artist" ? "rounded-full" : "rounded",
					)}
				/>
				<Skeleton className="h-5 w-3/4 rounded" />
				<Skeleton className="h-4 w-1/2 rounded" />
			</CardContent>
		</Card>
	);
}
