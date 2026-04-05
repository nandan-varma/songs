import Link from "next/link";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { Card, CardContent } from "@/components/ui/card";
import type { DetailedArtist } from "@/types/api";
import { EntityType } from "@/types/entity";

interface SimilarArtistsGridProps {
	artists: DetailedArtist["similarArtists"];
}

export function SimilarArtistsGrid({ artists }: SimilarArtistsGridProps) {
	if (!artists || artists.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-semibold">Similar Artists</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{artists.slice(0, 8).map((artist) => (
					<Card
						key={artist.id}
						className="overflow-hidden transition-colors hover:bg-accent/50"
					>
						<CardContent className="p-4">
							<Link href={`/artist?id=${artist.id}`}>
								<div className="space-y-3">
									<div className="relative aspect-square w-full">
										<ProgressiveImage
											images={artist.image}
											alt={artist.name}
											entityType={EntityType.ARTIST}
											rounded="full"
											sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
										/>
									</div>
									<div className="text-center">
										<h3 className="truncate font-medium hover:underline">
											{artist.name}
										</h3>
									</div>
								</div>
							</Link>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
