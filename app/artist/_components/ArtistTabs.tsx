import { Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LoadMoreButton } from "@/components/common/load-more-button";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArtistAlbums, useArtistSongs } from "@/hooks/data/queries";
import { feature_flags } from "@/lib/constants";
import type { ArtistSortBy, ArtistSortOrder } from "@/lib/queries/music";
import { detailedSongToSong } from "@/lib/utils";
import type { DetailedArtist } from "@/types/api";
import { EntityType } from "@/types/entity";

const SORT_OPTIONS = [
	{ value: "popularity:desc", label: "Most popular" },
	{ value: "latest:desc", label: "Newest" },
	{ value: "latest:asc", label: "Oldest" },
	{ value: "alphabetical:asc", label: "A to Z" },
	{ value: "alphabetical:desc", label: "Z to A" },
] as const;

interface Sort {
	sortBy: ArtistSortBy;
	sortOrder: ArtistSortOrder;
}

function parseSort(value: string): Sort {
	const option = SORT_OPTIONS.find((candidate) => candidate.value === value);
	const [sortBy, sortOrder] = (option?.value ?? "popularity:desc").split(":");
	return {
		sortBy: sortBy as ArtistSortBy,
		sortOrder: sortOrder as ArtistSortOrder,
	};
}

function SortSelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-40" size="sm">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{SORT_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
	return [...new Map(items.map((item) => [item.id, item])).values()];
}

interface ArtistTabsProps {
	artist: DetailedArtist;
	onPlayTopSongs: () => void;
}

export function ArtistTabs({ artist, onPlayTopSongs }: ArtistTabsProps) {
	const [songSort, setSongSort] = useState("popularity:desc");
	const [albumSort, setAlbumSort] = useState("popularity:desc");
	const songsQuery = useArtistSongs(
		artist.id,
		parseSort(songSort).sortBy,
		parseSort(songSort).sortOrder,
	);
	const albumsQuery = useArtistAlbums(
		artist.id,
		parseSort(albumSort).sortBy,
		parseSort(albumSort).sortOrder,
	);

	// The artist payload's top lists render instantly; the paged lists replace them once loaded.
	const topSongs = useMemo(() => {
		const paged = songsQuery.data?.pages.flatMap((page) => page.songs) ?? [];
		return paged.length > 0 ? dedupeById(paged) : (artist.topSongs ?? []);
	}, [songsQuery.data, artist.topSongs]);
	const topAlbums = useMemo(() => {
		const paged = albumsQuery.data?.pages.flatMap((page) => page.albums) ?? [];
		return paged.length > 0 ? dedupeById(paged) : (artist.topAlbums ?? []);
	}, [albumsQuery.data, artist.topAlbums]);
	const singles = artist.singles ?? [];
	const bio = artist.bio ?? [];

	return (
		<Tabs defaultValue="songs" className="space-y-4">
			<TabsList>
				<TabsTrigger value="songs">Top Songs</TabsTrigger>
				<TabsTrigger value="albums">Albums</TabsTrigger>
				{singles.length > 0 && (
					<TabsTrigger value="singles">Singles</TabsTrigger>
				)}
				{bio.length > 0 && <TabsTrigger value="bio">Bio</TabsTrigger>}
			</TabsList>

			<TabsContent value="songs" className="space-y-4">
				{topSongs.length > 0 ? (
					<>
						<div className="flex items-center justify-between gap-2">
							<Button onClick={onPlayTopSongs} className="gap-2">
								<Play className="h-4 w-4" />
								Play All
							</Button>
							<SortSelect value={songSort} onChange={setSongSort} />
						</div>
						<SongsList songs={topSongs.map(detailedSongToSong)} />
						<LoadMoreButton
							hasNextPage={songsQuery.hasNextPage}
							isFetching={songsQuery.isFetchingNextPage}
							onLoadMore={() => void songsQuery.fetchNextPage()}
						/>
					</>
				) : (
					<p className="py-8 text-center text-muted-foreground">
						No songs available
					</p>
				)}
			</TabsContent>

			<TabsContent value="albums" className="space-y-4">
				{topAlbums.length > 0 ? (
					<>
						<div className="flex justify-end">
							<SortSelect value={albumSort} onChange={setAlbumSort} />
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{topAlbums.map((album) => (
								<Card
									key={album.id}
									className="overflow-hidden transition-colors hover:bg-accent/50"
								>
									<CardContent className="p-4">
										<Link href={`/album?id=${album.id}`}>
											<div className="space-y-3">
												<div className="relative aspect-square w-full">
													<ProgressiveImage
														images={album.image}
														alt={album.name}
														entityType={EntityType.ALBUM}
														rounded="default"
														sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
													/>
												</div>
												<div className="space-y-1">
													<h3 className="truncate font-medium hover:underline">
														{album.name}
													</h3>
													<p className="text-sm text-muted-foreground">
														{album.year}
													</p>
												</div>
											</div>
										</Link>
									</CardContent>
								</Card>
							))}
						</div>
						<LoadMoreButton
							hasNextPage={albumsQuery.hasNextPage}
							isFetching={albumsQuery.isFetchingNextPage}
							onLoadMore={() => void albumsQuery.fetchNextPage()}
						/>
					</>
				) : (
					<p className="py-8 text-center text-muted-foreground">
						No albums available
					</p>
				)}
			</TabsContent>

			{singles.length > 0 && feature_flags.Artist_page_singles_enabled && (
				<TabsContent value="singles" className="space-y-4">
					<SongsList songs={singles.map(detailedSongToSong)} />
				</TabsContent>
			)}

			{bio.length > 0 && (
				<TabsContent value="bio" className="space-y-4">
					<Card>
						<CardContent className="space-y-4 p-6">
							{bio.map((section, index) => (
								<div key={section.title || `section-${index}`}>
									{section.title && (
										<h3 className="mb-2 text-lg font-semibold">
											{section.title}
										</h3>
									)}
									{section.text && (
										<p className="text-muted-foreground">{section.text}</p>
									)}
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>
			)}
		</Tabs>
	);
}
