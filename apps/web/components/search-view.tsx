"use client";

import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CardGrid } from "@/components/media-card";
import { EmptyState } from "@/components/section";
import { TrackList } from "@/components/track-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type CardSearchKind,
	type SearchKind,
	useCardSearch,
	useSongSearch,
} from "@/lib/api/queries";
import { cn } from "@/lib/utils";

const KINDS: SearchKind[] = ["songs", "albums", "artists", "playlists"];
const DEBOUNCE_MS = 300;

function isKind(value: string | null): value is SearchKind {
	return KINDS.some((kind) => kind === value);
}

export function SearchView() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const urlQuery = params.get("q") ?? "";
	const kindParam = params.get("type");
	const kind = isKind(kindParam) ? kindParam : "songs";

	const [text, setText] = useState(urlQuery);
	useEffect(() => {
		const timer = setTimeout(() => {
			const next = new URLSearchParams(params);
			if (text.trim()) next.set("q", text.trim());
			else next.delete("q");
			if (next.toString() !== params.toString()) {
				router.replace(`${pathname}?${next}`);
			}
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [text, params, pathname, router]);

	return (
		<div className="space-y-6">
			<div className="relative">
				<Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
				<Input
					type="search"
					autoFocus
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder="Songs, albums, artists, playlists"
					aria-label="Search"
					className="pl-9"
				/>
			</div>
			<nav className="flex gap-2" aria-label="Result type">
				{KINDS.map((name) => (
					<Link
						key={name}
						href={`${pathname}?${new URLSearchParams({ ...(urlQuery && { q: urlQuery }), type: name })}`}
						replace
						className={cn(
							"rounded-full bg-secondary px-3 py-1 text-sm capitalize",
							name === kind && "bg-primary text-primary-foreground",
						)}
					>
						{name}
					</Link>
				))}
			</nav>
			{urlQuery ? (
				<Results kind={kind} query={urlQuery} />
			) : (
				<EmptyState>Search for something to listen to.</EmptyState>
			)}
		</div>
	);
}

function Results({ kind, query }: { kind: SearchKind; query: string }) {
	return kind === "songs" ? (
		<SongResults query={query} />
	) : (
		<CardResults kind={kind} query={query} />
	);
}

function SongResults({ query }: { query: string }) {
	const search = useSongSearch(query);
	return (
		<Paged search={search}>{(tracks) => <TrackList tracks={tracks} />}</Paged>
	);
}

function CardResults({ kind, query }: { kind: CardSearchKind; query: string }) {
	const search = useCardSearch(kind, query);
	return <Paged search={search}>{(cards) => <CardGrid cards={cards} />}</Paged>;
}

function Paged<T>({
	search,
	children,
}: {
	search: UseInfiniteQueryResult<T[]>;
	children: (items: T[]) => React.ReactNode;
}) {
	if (search.isPending) return <EmptyState>Searching...</EmptyState>;
	if (search.isError) return <EmptyState>Search failed. Try again.</EmptyState>;
	if (search.data.length === 0) return <EmptyState>No results.</EmptyState>;

	return (
		<div className="space-y-6">
			{children(search.data)}
			{search.hasNextPage && (
				<div className="flex justify-center">
					<Button
						variant="secondary"
						disabled={search.isFetchingNextPage}
						onClick={() => search.fetchNextPage()}
					>
						{search.isFetchingNextPage ? "Loading..." : "Load more"}
					</Button>
				</div>
			)}
		</div>
	);
}
