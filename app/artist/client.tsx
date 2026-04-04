"use client";

import { ExternalLink, Play } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArtist } from "@/hooks/data/queries";
import { useIsOffline } from "@/hooks/network/use-is-offline";
import { useOfflinePlayerActions } from "@/hooks/player/use-offline-player";
import { detailedSongToSong } from "@/lib/utils";
import {
	type DetailedAlbum,
	type DetailedSong,
	EntityType,
} from "@/types/entity";

export function Client() {
	const [id] = useQueryState("id");
	const { playQueue } = useOfflinePlayerActions();
	const isOffline = useIsOffline();

	const { data: artist, isPending: isArtistPending } = useArtist(id || "", {
		enabled: !!id && !isOffline,
	});

	// Use data from artist object instead of making separate API calls
	// Filter out null values and ensure we always have arrays
	const allSongs: DetailedSong[] =
		artist?.topSongs && artist.topSongs.length > 0 ? artist.topSongs : [];
	const filteredSongs = allSongs;
	const allAlbums: DetailedAlbum[] =
		artist?.topAlbums && artist.topAlbums.length > 0 ? artist.topAlbums : [];

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Artist ID is required</p>
			</div>
		);
	}

	if (isOffline) {
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

	// Show loading state while fetching artist
	if (isArtistPending) {
		return (
			<div className="container mx-auto px-4 py-8 pb-32 space-y-8">
				{/* Artist Header */}
				<Card>
					<CardContent className="p-6">
						<div className="flex flex-col md:flex-row gap-6">
							{/* Artist Image Skeleton */}
							<Skeleton className="relative aspect-square w-full md:w-64 flex-shrink-0 rounded-full" />

							{/* Artist Details Skeleton */}
							<div className="flex-1 space-y-4">
								<div className="space-y-2">
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-10 w-3/4" />
								</div>

								<div className="flex gap-4">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-4 w-12" />
								</div>

								{/* Social Links Skeleton */}
								<div className="flex gap-2">
									<Skeleton className="h-8 w-20" />
									<Skeleton className="h-8 w-16" />
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Tabs Skeleton */}
				<Tabs defaultValue="songs" className="space-y-4">
					<TabsList>
						<TabsTrigger value="songs">Top Songs</TabsTrigger>
						<TabsTrigger value="albums">Albums</TabsTrigger>
						<TabsTrigger value="singles">Singles</TabsTrigger>
						<TabsTrigger value="bio">Bio</TabsTrigger>
					</TabsList>

					{/* Top Songs Skeleton */}
					<TabsContent value="songs" className="space-y-4">
						<Skeleton className="h-10 w-24" />
						<div className="space-y-4">
							{Array.from({ length: 10 }).map((_, i) => (
								<div
									// Skeleton items are static loading placeholders with a fixed count.
									// The index is stable and appropriate for keys here since items don't reorder.
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
									key={`song-skeleton-${i}`}
									className="flex items-center gap-4 p-4 rounded-lg border"
								>
									<Skeleton className="h-12 w-12 rounded" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/2" />
									</div>
									<Skeleton className="h-8 w-8" />
								</div>
							))}
						</div>
					</TabsContent>

					{/* Albums Skeleton */}
					<TabsContent value="albums" className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{Array.from({ length: 8 }).map((_, i) => (
								// Skeleton items are static loading placeholders with a fixed count.
								// The index is stable and appropriate for keys here since items don't reorder.
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
								<Card key={`album-skeleton-${i}`}>
									<CardContent className="p-4">
										<Skeleton className="aspect-square w-full rounded" />
										<div className="space-y-2 mt-3">
											<Skeleton className="h-4 w-full" />
											<Skeleton className="h-3 w-1/2" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					{/* Singles Skeleton */}
					<TabsContent value="singles" className="space-y-4">
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									// Skeleton items are static loading placeholders with a fixed count.
									// The index is stable and appropriate for keys here since items don't reorder.
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
									key={`single-skeleton-${i}`}
									className="flex items-center gap-4 p-4 rounded-lg border"
								>
									<Skeleton className="h-12 w-12 rounded" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/2" />
									</div>
									<Skeleton className="h-8 w-8" />
								</div>
							))}
						</div>
					</TabsContent>

					{/* Bio Skeleton */}
					<TabsContent value="bio" className="space-y-4">
						<Card>
							<CardContent className="p-6 space-y-4">
								<Skeleton className="h-6 w-1/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-6 w-1/3" />
								<Skeleton className="h-4 w-full" />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Similar Artists Skeleton */}
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							// Skeleton items are static loading placeholders with a fixed count.
							// The index is stable and appropriate for keys here since items don't reorder.
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
							<Card key={`artist-skeleton-${i}`}>
								<CardContent className="p-4">
									<Skeleton className="aspect-square w-full rounded-full" />
									<div className="text-center mt-3">
										<Skeleton className="h-4 w-3/4 mx-auto" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!artist) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">Artist not found</p>
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
								sizes="(max-width: 768px) 100vw, 256px"
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
								{artist.bio?.map((section, index) => (
									<div key={section.title || `section-${index}`}>
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
						{artist.similarArtists?.slice(0, 8).map((similarArtist) => (
							<Card
								key={similarArtist.id}
								className="overflow-hidden hover:bg-accent/50 transition-colors"
							>
								<CardContent className="p-4">
									<Link href={`/artist?id=${similarArtist.id}`}>
										<div className="space-y-3">
											<div className="relative aspect-square w-full">
												<ProgressiveImage
													images={similarArtist.image}
													alt={similarArtist.name}
													entityType={EntityType.ARTIST}
													rounded="full"
													sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
