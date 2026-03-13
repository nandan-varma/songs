import { Disc3, Play, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { ProgressiveImage } from "@/components/common/progressive-image";
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

/**
 * Displays album hero section with artwork, metadata, and action buttons
 */
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
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Album Art */}
						<motion.div
							className="relative aspect-square w-full md:w-64 shrink-0"
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
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
									<Disc3 className="h-24 w-24 text-muted-foreground" />
								</div>
							)}
						</motion.div>
						<motion.div
							className="flex-1 space-y-4"
							variants={{
								hidden: { opacity: 0, y: 20 },
								show: { opacity: 1, y: 0 },
							}}
						>
							<div>
								<Badge variant="secondary" className="mb-2">
									Album
								</Badge>
								<h1 className="text-4xl font-bold">{album.name}</h1>
							</div>

							<div className="space-y-2">
								<div>
									<span className="text-sm text-muted-foreground">
										Artists:{" "}
									</span>
									{album.artists?.primary?.map((artist, index) => (
										<span key={artist.id}>
											<Link
												href={`/artist?id=${artist.id}`}
												className="text-sm hover:underline"
											>
												{artist.name}
											</Link>
											{index < album.artists.primary.length - 1 && ", "}
										</span>
									))}
								</div>

								<div className="flex gap-4 text-sm text-muted-foreground">
									{album.year && <span>{album.year}</span>}
									{album.language && (
										<span className="capitalize">{album.language}</span>
									)}
									{album.songCount && <span>{album.songCount} songs</span>}
								</div>

								{album.description && (
									<p className="text-sm text-muted-foreground">
										{album.description}
									</p>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2">
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button
										size="lg"
										onClick={onPlayAll}
										className="gap-2"
										disabled={songsCount === 0}
									>
										<Play className="h-5 w-5" />
										Play All
									</Button>
								</motion.div>
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button
										size="lg"
										variant="outline"
										onClick={onAddAllToQueue}
										className="gap-2"
										disabled={songsCount === 0}
									>
										<Plus className="h-5 w-5" />
										Add All to Queue
									</Button>
								</motion.div>
							</div>
						</motion.div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
