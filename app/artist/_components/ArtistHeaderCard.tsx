import { ExternalLink, Loader2, Play, Radio, Shuffle } from "lucide-react";
import { useState } from "react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { ShareButton } from "@/components/common/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getArtistById } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";
import type { DetailedArtist } from "@/types/api";
import { EntityType } from "@/types/entity";

interface ArtistHeaderCardProps {
	artist: DetailedArtist;
}

const SOCIAL_LINKS = [
	{ key: "fb", label: "Facebook" },
	{ key: "twitter", label: "Twitter" },
	{ key: "wiki", label: "Wikipedia" },
] as const;

export function ArtistHeaderCard({ artist }: ArtistHeaderCardProps) {
	const [isLoading, setIsLoading] = useState<string | null>(null);

	const handlePlay = async () => {
		try {
			setIsLoading("play");
			const detailed = await getArtistById(artist.id, { songCount: 20 });
			if (detailed?.topSongs && detailed.topSongs.length > 0) {
				useAppStore.getState().playQueue(detailed.topSongs);
			}
		} catch (error) {
			logError("ArtistHeaderCard:play", error);
		} finally {
			setIsLoading(null);
		}
	};

	const handleShuffle = async () => {
		try {
			setIsLoading("shuffle");
			const detailed = await getArtistById(artist.id, { songCount: 20 });
			if (detailed?.topSongs && detailed.topSongs.length > 0) {
				const shuffled = [...detailed.topSongs].sort(() => Math.random() - 0.5);
				useAppStore.getState().playQueue(shuffled);
			}
		} catch (error) {
			logError("ArtistHeaderCard:shuffle", error);
		} finally {
			setIsLoading(null);
		}
	};

	const handleRadio = async () => {
		try {
			setIsLoading("radio");
			const detailed = await getArtistById(artist.id, { songCount: 30 });
			if (detailed?.topSongs && detailed.topSongs.length > 0) {
				const radioSongs = [...detailed.topSongs].sort(
					() => Math.random() - 0.5,
				);
				useAppStore.getState().playQueue(radioSongs);
				useAppStore.getState().toggleShuffle();
			}
		} catch (error) {
			logError("ArtistHeaderCard:radio", error);
		} finally {
			setIsLoading(null);
		}
	};

	return (
		<Card>
			<CardContent className="p-4 sm:p-6">
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="relative aspect-square w-full flex-shrink-0 md:w-52 lg:w-60">
						<ProgressiveImage
							images={artist.image}
							alt={artist.name}
							entityType={EntityType.ARTIST}
							rounded="full"
							priority
							sizes="(max-width: 768px) 100vw, 240px"
						/>
					</div>

					<div className="flex-1 space-y-3">
						<div>
							<Badge variant="secondary" className="mb-2">
								Artist
							</Badge>
							{artist.isVerified && (
								<Badge variant="default" className="mb-2 ml-2">
									Verified
								</Badge>
							)}
							<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
								{artist.name}
							</h1>
						</div>

						<div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
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

						<div className="flex flex-wrap gap-2">
							<Button
								size="sm"
								onClick={handlePlay}
								disabled={isLoading !== null}
								className="gap-1.5"
							>
								{isLoading === "play" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Play className="h-4 w-4 fill-current" />
								)}
								Play
							</Button>
							<Button
								size="sm"
								variant="secondary"
								onClick={handleShuffle}
								disabled={isLoading !== null}
								className="gap-1.5"
							>
								{isLoading === "shuffle" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Shuffle className="h-4 w-4" />
								)}
								Shuffle
							</Button>
							{(artist.isRadioPresent === true ||
								(artist.topSongs && artist.topSongs.length > 5)) && (
								<Button
									size="sm"
									variant="outline"
									onClick={handleRadio}
									disabled={isLoading !== null}
									className="gap-1.5"
								>
									{isLoading === "radio" ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Radio className="h-4 w-4" />
									)}
									Radio
								</Button>
							)}
							<ShareButton title={artist.name} type="artist" id={artist.id} />
						</div>

						<div className="flex flex-wrap gap-2 pt-1">
							{SOCIAL_LINKS.map(({ key, label }) => {
								const href = artist[key];
								if (!href) {
									return null;
								}

								return (
									<Button key={key} variant="outline" size="sm" asChild>
										<a href={href} target="_blank" rel="noopener noreferrer">
											<ExternalLink className="mr-1.5 h-3.5 w-3.5" />
											{label}
										</a>
									</Button>
								);
							})}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
