"use client";

import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CollectionGrid } from "@/components/collection-card";
import { Cover } from "@/components/cover";
import { Highlight } from "@/components/highlight";
import { InfiniteSentinel } from "@/components/infinite-sentinel";
import { SEARCH_INPUT_ID } from "@/components/search-box";
import { Section } from "@/components/section";
import {
	CollectionGridSkeleton,
	SongListSkeleton,
} from "@/components/skeletons";
import { SongList } from "@/components/song-list";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { getSong } from "@/lib/api/data";
import {
	type CardSearchKind,
	useCardSearch,
	useSearchOverview,
	useSongSearch,
	useTrending,
} from "@/lib/api/queries";
import type { TopResult } from "@/lib/models";
import { queryParam, SEARCH_TYPES, typeParam } from "@/lib/search-params";
import { usePlayer } from "@/lib/stores/player";
import { useSearchHistory } from "@/lib/stores/search";
import { cn } from "@/lib/utils";

type SearchType = (typeof SEARCH_TYPES)[number];

export function SearchResults() {
	const [query, setQuery] = useQueryState("q", queryParam);
	const [type, setType] = useQueryState("type", typeParam);
	const remember = useSearchHistory((s) => s.remember);
	const term = query.trim();

	const arrivedWithQuery = useRef(term !== "");
	useEffect(() => {
		if (!arrivedWithQuery.current) {
			document.getElementById(SEARCH_INPUT_ID)?.focus();
		}
	}, []);

	if (!term) return <Idle onPick={(recent) => void setQuery(recent)} />;

	return (
		<div className="space-y-6">
			<fieldset className="flex min-w-0 gap-2 overflow-x-auto">
				<legend className="sr-only">Result type</legend>
				{SEARCH_TYPES.map((name) => (
					<Button
						key={name}
						variant="chip"
						size="sm"
						data-active={name === type}
						aria-pressed={name === type}
						className="capitalize"
						onClick={() => void setType(name)}
					>
						{name}
					</Button>
				))}
			</fieldset>
			<div onClickCapture={() => remember(term)}>
				<Results
					type={type}
					term={term}
					onSeeAll={(next) => void setType(next)}
				/>
			</div>
		</div>
	);
}

function Results({
	type,
	term,
	onSeeAll,
}: {
	type: SearchType;
	term: string;
	onSeeAll: (type: SearchType) => void;
}) {
	if (type === "all") return <Overview term={term} onSeeAll={onSeeAll} />;
	if (type === "songs") return <SongResults term={term} />;
	return <CardResults kind={type} term={term} />;
}

function NoResults({ term }: { term: string }) {
	return (
		<EmptyState
			title={`No results for “${term}”`}
			hint="Check the spelling or try a different search."
		/>
	);
}

function Overview({
	term,
	onSeeAll,
}: {
	term: string;
	onSeeAll: (type: SearchType) => void;
}) {
	const search = useSearchOverview(term);

	if (search.isPending) {
		return (
			<div className="space-y-8">
				<SongListSkeleton count={4} />
				<CollectionGridSkeleton />
			</div>
		);
	}
	if (search.isError) {
		return (
			<ErrorState message="Search failed." onRetry={() => search.refetch()} />
		);
	}

	const { top, songs, artists, albums, playlists } = search.data;
	if (
		!top &&
		!songs.length &&
		!artists.length &&
		!albums.length &&
		!playlists.length
	) {
		return <NoResults term={term} />;
	}

	const seeAll = (type: SearchType) => (
		<Button variant="ghost" size="sm" onClick={() => onSeeAll(type)}>
			See all
		</Button>
	);

	return (
		<div
			aria-busy={search.isPlaceholderData}
			className={cn(
				"space-y-8 transition-opacity duration-150",
				search.isPlaceholderData && "opacity-60",
			)}
		>
			{top && (
				<Section title="Top result">
					<TopResultCard top={top} term={term} />
				</Section>
			)}
			{songs.length > 0 && (
				<Section title="Songs" action={seeAll("songs")}>
					<SongList tracks={songs} highlight={term} />
				</Section>
			)}
			{artists.length > 0 && (
				<Section title="Artists" action={seeAll("artists")}>
					<CollectionGrid cards={artists} highlight={term} />
				</Section>
			)}
			{albums.length > 0 && (
				<Section title="Albums" action={seeAll("albums")}>
					<CollectionGrid cards={albums} highlight={term} />
				</Section>
			)}
			{playlists.length > 0 && (
				<Section title="Playlists" action={seeAll("playlists")}>
					<CollectionGrid cards={playlists} highlight={term} />
				</Section>
			)}
		</div>
	);
}

function TopResultCard({ top, term }: { top: TopResult; term: string }) {
	const [loading, setLoading] = useState(false);

	const playSong = async () => {
		setLoading(true);
		try {
			const { track } = await getSong(top.id);
			usePlayer.getState().play([track]);
		} catch {
			toast.error("This song could not be played");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center gap-4 rounded-md border bg-card p-4">
			<Cover
				src={top.image}
				alt=""
				sizes="128px"
				className={cn(
					"size-24 shrink-0 sm:size-32",
					top.kind === "artist" && "rounded-full",
				)}
			/>
			<div className="min-w-0 flex-1 space-y-1">
				<p className="text-xs text-muted-foreground uppercase">{top.kind}</p>
				<h3 className="truncate text-xl font-semibold">
					<Highlight text={top.title} query={term} />
				</h3>
				{top.subtitle && (
					<p className="truncate text-sm text-muted-foreground">
						{top.subtitle}
					</p>
				)}
				{top.kind === "song" ? (
					<Button
						data-result
						disabled={loading}
						onClick={playSong}
						className="mt-2"
					>
						Play
					</Button>
				) : (
					<Button asChild data-result className="mt-2">
						<Link href={`/${top.kind}/${top.id}`}>Open</Link>
					</Button>
				)}
			</div>
		</div>
	);
}

function SongResults({ term }: { term: string }) {
	const search = useSongSearch(term);
	return (
		<Paged
			search={search}
			term={term}
			skeleton={<SongListSkeleton count={8} />}
		>
			{(tracks) => <SongList tracks={tracks} highlight={term} />}
		</Paged>
	);
}

function CardResults({ kind, term }: { kind: CardSearchKind; term: string }) {
	const search = useCardSearch(kind, term);
	return (
		<Paged
			search={search}
			term={term}
			skeleton={<CollectionGridSkeleton count={12} />}
		>
			{(cards) => <CollectionGrid cards={cards} highlight={term} />}
		</Paged>
	);
}

function Paged<T>({
	search,
	term,
	skeleton,
	children,
}: {
	search: UseInfiniteQueryResult<T[]>;
	term: string;
	skeleton: React.ReactNode;
	children: (items: T[]) => React.ReactNode;
}) {
	if (search.isPending) return skeleton;
	if (search.isError) {
		return (
			<ErrorState message="Search failed." onRetry={() => search.refetch()} />
		);
	}
	if (search.data.length === 0) return <NoResults term={term} />;

	return (
		<div
			aria-busy={search.isPlaceholderData}
			className={cn(
				"space-y-4 transition-opacity duration-150",
				search.isPlaceholderData && "opacity-60",
			)}
		>
			{children(search.data)}
			{search.isFetchingNextPage && skeleton}
			{search.hasNextPage && !search.isFetchingNextPage && (
				<InfiniteSentinel onVisible={() => search.fetchNextPage()} />
			)}
		</div>
	);
}

function Idle({ onPick }: { onPick: (recent: string) => void }) {
	const recents = useSearchHistory((s) => s.recents);
	const clear = useSearchHistory((s) => s.clear);
	const trending = useTrending();

	return (
		<div className="space-y-8">
			{recents.length > 0 && (
				<Section
					title="Recent searches"
					action={
						<Button variant="ghost" size="sm" onClick={clear}>
							Clear
						</Button>
					}
				>
					<div className="flex flex-wrap gap-2">
						{recents.map((recent) => (
							<Button
								key={recent}
								variant="chip"
								size="sm"
								onClick={() => onPick(recent)}
							>
								{recent}
							</Button>
						))}
					</div>
				</Section>
			)}
			<Section title="Trending now">
				{trending.isPending && <SongListSkeleton count={6} />}
				{trending.isError && (
					<ErrorState
						message="Trending is unavailable."
						onRetry={() => trending.refetch()}
					/>
				)}
				{trending.data && <SongList tracks={trending.data.songs.slice(0, 6)} />}
			</Section>
			{trending.data && (
				<Section title="Trending albums">
					<CollectionGrid cards={trending.data.albums.slice(0, 6)} />
				</Section>
			)}
		</div>
	);
}
