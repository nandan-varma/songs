import { ExternalLink } from "lucide-react";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex flex-col gap-6 md:flex-row">
					<div className="relative aspect-square w-full flex-shrink-0 md:w-64">
						<ProgressiveImage
							images={artist.image}
							alt={artist.name}
							entityType={EntityType.ARTIST}
							rounded="full"
							priority
							sizes="(max-width: 768px) 100vw, 256px"
						/>
					</div>

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

						<div className="flex flex-wrap gap-2">
							{SOCIAL_LINKS.map(({ key, label }) => {
								const href = artist[key];
								if (!href) {
									return null;
								}

								return (
									<Button key={key} variant="outline" size="sm" asChild>
										<a href={href} target="_blank" rel="noopener noreferrer">
											<ExternalLink className="mr-2 h-4 w-4" />
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
