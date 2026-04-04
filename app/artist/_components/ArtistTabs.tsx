import { Play } from "lucide-react";
import Link from "next/link";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { SongsList } from "@/components/songs-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { detailedSongToSong } from "@/lib/utils";
import type { DetailedArtist } from "@/types/api";
import { EntityType } from "@/types/entity";

interface ArtistTabsProps {
	artist: DetailedArtist;
	onPlayTopSongs: () => void;
}

export function ArtistTabs({ artist, onPlayTopSongs }: ArtistTabsProps) {
	const topSongs = artist.topSongs ?? [];
	const topAlbums = artist.topAlbums ?? [];
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
						<div className="flex gap-2">
							<Button onClick={onPlayTopSongs} className="gap-2">
								<Play className="h-4 w-4" />
								Play All
							</Button>
						</div>
						<SongsList songs={topSongs.map(detailedSongToSong)} />
					</>
				) : (
					<p className="py-8 text-center text-muted-foreground">
						No songs available
					</p>
				)}
			</TabsContent>

			<TabsContent value="albums" className="space-y-4">
				{topAlbums.length > 0 ? (
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
				) : (
					<p className="py-8 text-center text-muted-foreground">
						No albums available
					</p>
				)}
			</TabsContent>

			{singles.length > 0 && (
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
