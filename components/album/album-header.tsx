import { Disc3, Play, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { ShareButton } from "@/components/common/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAnimationPreferences } from "@/hooks/ui/use-animation-preferences";
import { type DetailedAlbum, EntityType } from "@/types/entity";

interface AlbumHeaderProps {
	album: DetailedAlbum;
	songsCount: number;
	onPlayAll: () => void;
	onAddAllToQueue: () => void;
}

export function AlbumHeader({
	album,
	songsCount,
	onPlayAll,
	onAddAllToQueue,
}: AlbumHeaderProps) {
	const { getTransition } = useAnimationPreferences();

	return (
		<motion.div
			initial="hidden"
			animate="show"
			transition={getTransition({ staggerChildren: 0.1 }, { duration: 0 })}
		>
			<Card>
				<CardContent className="p-4 sm:p-6">
					<div className="flex flex-col md:flex-row gap-4 sm:gap-6">
						<motion.div
							className="relative aspect-square w-full md:w-52 lg:w-60 shrink-0"
							variants={{
								hidden: { opacity: 0, scale: 0.9 },
								show: { opacity: 1, scale: 1 },
							}}
						>
							{album.image && album.image.length > 0 ? (
								<ProgressiveImage
									images={album.image}
									alt={album.name}
									entityType={EntityType.ALBUM}
									rounded="default"
									priority
									sizes="(max-width: 768px) 100vw, 240px"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
									<Disc3 className="h-16 sm:h-24 text-muted-foreground" />
								</div>
							)}
						</motion.div>
						<motion.div
							className="flex-1 space-y-3"
							variants={{
								hidden: { opacity: 0, y: 20 },
								show: { opacity: 1, y: 0 },
							}}
						>
							<div>
								<Badge variant="secondary" className="mb-2">
									Album
								</Badge>
								<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
									{album.name}
								</h1>
							</div>

							<div className="space-y-1.5">
								<div>
									<span className="text-xs sm:text-sm text-muted-foreground">
										Artists:{" "}
									</span>
									{album.artists?.primary?.map((artist, index) => (
										<span key={artist.id}>
											<Link
												href={`/artist?id=${artist.id}`}
												className="text-xs sm:text-sm hover:underline"
											>
												{artist.name}
											</Link>
											{index < album.artists.primary.length - 1 && ", "}
										</span>
									))}
								</div>

								<div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
									{album.year && <span>{album.year}</span>}
									{album.language && (
										<span className="capitalize">{album.language}</span>
									)}
									{album.songCount && <span>{album.songCount} songs</span>}
								</div>

								{album.description && (
									<p className="text-xs sm:text-sm text-muted-foreground">
										{album.description}
									</p>
								)}
							</div>

							<div className="flex flex-wrap gap-2 items-center">
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button
										size="sm"
										onClick={onPlayAll}
										className="gap-1.5"
										disabled={songsCount === 0}
									>
										<Play className="h-4 w-4" />
										Play
									</Button>
								</motion.div>
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button
										size="sm"
										variant="secondary"
										onClick={onAddAllToQueue}
										className="gap-1.5"
										disabled={songsCount === 0}
									>
										<Plus className="h-4 w-4" />
										Add
									</Button>
								</motion.div>
								<ShareButton title={album.name} type="album" id={album.id} />
							</div>
						</motion.div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
