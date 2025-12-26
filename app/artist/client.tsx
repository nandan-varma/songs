"use client";

import { ExternalLink, Play } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ProgressiveImage } from "@/components/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistory } from "@/contexts/history-context";
import { useOffline } from "@/contexts/offline-context";
import { usePlayerActions } from "@/contexts/player-context";
import { type DetailedArtist, EntityType } from "@/lib/types";

interface ClientProps {
	artist: DetailedArtist;
}

export function Client({ artist }: ClientProps) {
	const { playQueue } = usePlayerActions();
	const { getFilteredSongs } = useOffline();
	const { addToHistory } = useHistory();

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

	const topSongs = artist.topSongs ?? [];
	const filteredSongs = getFilteredSongs(topSongs);
	const topAlbums = artist.topAlbums ?? [];

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
							<SongsList songs={filteredSongs} />
						</>
					) : (
						<p className="text-center text-muted-foreground py-8">
							No songs available
						</p>
					)}
				</TabsContent>

				{/* Albums */}
				<TabsContent value="albums" className="space-y-4">
					{topAlbums.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{topAlbums.map((album) => (
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
						<SongsList songs={artist.singles} />
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
									<Link href={`/artist?id=${similarArtist.id}`}>
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
