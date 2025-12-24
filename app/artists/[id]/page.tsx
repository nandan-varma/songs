"use client";

import { ExternalLink, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProgressiveImage } from "@/components/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { useArtist, useArtistAlbums, useArtistSongs } from "@/hooks/queries";
import { useOfflinePlayerActions } from "@/hooks/use-offline-player";
import { type DetailedAlbum, type DetailedSong, EntityType } from "@/lib/types";
import { detailedSongToSong } from "@/lib/utils";

function ArtistPageContent() {
	const params = useParams();
	const artistId = params.id as string;
	const { playQueue } = useOfflinePlayerActions();
	const { getFilteredSongs, shouldEnableQuery, isOfflineMode } = useOffline();
	const { addToHistory } = useHistory();

	// Add to history when artist loads
	const {
		data: artist,
		isLoading,
		error,
	} = useArtist(artistId, {
		songCount: 0,
		albumCount: 0,
		queryOptions: {
			enabled: shouldEnableQuery(),
		},
	});

	useEffect(() => {
		if (artist) {
			addToHistory({
				id: artist.id,
				type: EntityType.ARTIST,
				data: artist,
				timestamp: new Date(),
			});
		}
	}, [artist, addToHistory]);

	const songsQuery = useArtistSongs(artistId, "popularity", "desc", {
		enabled: shouldEnableQuery(),
	});
	const albumsQuery = useArtistAlbums(artistId, "popularity", "desc", {
		enabled: shouldEnableQuery(),
	});

	const songsData = songsQuery.data as
		| { pages: Array<{ total: number; songs: DetailedSong[] }> }
		| undefined;
	const albumsData = albumsQuery.data as
		| { pages: Array<{ total: number; albums: DetailedAlbum[] }> }
		| undefined;

	const allSongs: DetailedSong[] =
		songsData?.pages.flatMap((page) => page.songs) ?? [];
	const filteredSongs = getFilteredSongs(allSongs);
	const allAlbums: DetailedAlbum[] =
		albumsData?.pages.flatMap((page) => page.albums) ?? [];
	const _totalSongs = songsData?.pages[0]?.total ?? 0;
	const _totalAlbums = albumsData?.pages[0]?.total ?? 0;

	const _fetchNextSongsPage = songsQuery.fetchNextPage;
	const _hasMoreSongs = songsQuery.hasNextPage;
	const _isLoadingMoreSongs = songsQuery.isFetchingNextPage;

	const _fetchNextAlbumsPage = albumsQuery.fetchNextPage;
	const _hasMoreAlbums = albumsQuery.hasNextPage;
	const _isLoadingMoreAlbums = albumsQuery.isFetchingNextPage;

	// Add to history when artist loads
	useEffect(() => {
		if (artist) {
			addToHistory({
				id: artist.id,
				type: EntityType.ARTIST,
				data: artist,
				timestamp: new Date(),
			});
		}
	}, [artist, addToHistory]);

	if (isOfflineMode) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="text-center py-12">
					<CardContent>
						<p className="text-muted-foreground">
							Artist details are not available in offline mode. Please disable
							offline mode to view this artist.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (error || !artist) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">
					{error instanceof Error ? error.message : "Artist not found"}
				</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
			{/* Artist Header */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Artist Image */}
						<div className="relative aspect-square w-full md:w-64 flex-shrink-0">
							<ProgressiveImage
								images={artist.image}
								alt={artist.name}
								entityType={EntityType.ARTIST}
								rounded="full"
								priority
							/>
						</div>

						{/* Artist Details */}
						<div className="flex-1 space-y-4">
							<div>
								<Badge variant="secondary" className="mb-2">
									Artist
								</Badge>
								{artist.isVerified && (
									<Badge variant="default" className="mb-2 ml-2">
										Verified
									</Badge>
								)}
								<h1 className="text-4xl font-bold">{artist.name}</h1>
							</div>

							<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
								{artist.followerCount && (
									<span>{artist.followerCount.toLocaleString()} followers</span>
								)}
								{artist.dominantLanguage && (
									<span className="capitalize">{artist.dominantLanguage}</span>
								)}
								{artist.dominantType && (
									<span className="capitalize">{artist.dominantType}</span>
								)}
							</div>

							{/* Social Links */}
							{(artist.fb || artist.twitter || artist.wiki) && (
								<div className="flex gap-2">
									{artist.fb && (
										<Button variant="outline" size="sm" asChild>
											<a
												href={artist.fb}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ExternalLink className="h-4 w-4 mr-2" />
												Facebook
											</a>
										</Button>
									)}
									{artist.twitter && (
										<Button variant="outline" size="sm" asChild>
											<a
												href={artist.twitter}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ExternalLink className="h-4 w-4 mr-2" />
												Twitter
											</a>
										</Button>
									)}
									{artist.wiki && (
										<Button variant="outline" size="sm" asChild>
											<a
												href={artist.wiki}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ExternalLink className="h-4 w-4 mr-2" />
												Wikipedia
											</a>
										</Button>
									)}
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabs for Songs, Albums, Bio */}
			<Tabs defaultValue="songs" className="space-y-4">
				<TabsList>
					<TabsTrigger value="songs">Top Songs</TabsTrigger>
					<TabsTrigger value="albums">Albums</TabsTrigger>
					{artist.singles && artist.singles.length > 0 && (
						<TabsTrigger value="singles">Singles</TabsTrigger>
					)}
					{artist.bio && artist.bio.length > 0 && (
						<TabsTrigger value="bio">Bio</TabsTrigger>
					)}
				</TabsList>

				{/* Top Songs */}
				<TabsContent value="songs" className="space-y-4">
					{filteredSongs.length > 0 ? (
						<>
							<div className="flex gap-2">
								<Button
									onClick={() => {
										playQueue(filteredSongs);
									}}
									className="gap-2"
								>
									<Play className="h-4 w-4" />
									Play All
								</Button>
							</div>
							<SongsList songs={filteredSongs.map(detailedSongToSong)} />
						</>
					) : !songsData ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<p className="text-center text-muted-foreground py-8">
							No songs available
						</p>
					)}
				</TabsContent>

				{/* Albums */}
				<TabsContent value="albums" className="space-y-4">
					{allAlbums.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{allAlbums.map((album) => (
								<Card
									key={album.id}
									className="overflow-hidden hover:bg-accent/50 transition-colors"
								>
									<CardContent className="p-4">
										<Link href={`/albums/${album.id}`}>
											<div className="space-y-3">
												<div className="relative aspect-square w-full">
													<ProgressiveImage
														images={album.image}
														alt={album.name}
														entityType={EntityType.ALBUM}
														rounded="default"
													/>
												</div>
												<div className="space-y-1">
													<h3 className="font-medium truncate hover:underline">
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
					) : !albumsData ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : (
						<p className="text-center text-muted-foreground py-8">
							No albums available
						</p>
					)}
				</TabsContent>

				{/* Singles */}
				{artist.singles && artist.singles.length > 0 && (
					<TabsContent value="singles" className="space-y-4">
						<SongsList songs={artist.singles.map(detailedSongToSong)} />
					</TabsContent>
				)}

				{/* Bio */}
				{artist.bio && artist.bio.length > 0 && (
					<TabsContent value="bio" className="space-y-4">
						<Card>
							<CardContent className="p-6 space-y-4">
								{artist.bio.map((section, index) => (
									<div key={`${section.title || "section"}-${index}`}>
										{section.title && (
											<h3 className="text-lg font-semibold mb-2">
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

			{/* Similar Artists */}
			{artist.similarArtists && artist.similarArtists.length > 0 && (
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold">Similar Artists</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{artist.similarArtists.slice(0, 8).map((similarArtist) => (
							<Card
								key={similarArtist.id}
								className="overflow-hidden hover:bg-accent/50 transition-colors"
							>
								<CardContent className="p-4">
									<Link href={`/artists/${similarArtist.id}`}>
										<div className="space-y-3">
											<div className="relative aspect-square w-full">
												<ProgressiveImage
													images={similarArtist.image}
													alt={similarArtist.name}
													entityType={EntityType.ARTIST}
													rounded="full"
												/>
											</div>
											<div className="text-center">
												<h3 className="font-medium truncate hover:underline">
													{similarArtist.name}
												</h3>
											</div>
										</div>
									</Link>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default function ArtistPage() {
	return (
		<ErrorBoundary context="ArtistPage">
			<ArtistPageContent />
		</ErrorBoundary>
	);
}
