import { motion } from "motion/react";
import { Music, Play, Plus } from "lucide-react";
import Link from "next/link";
import { ProgressiveImage } from "@/components/common/progressive-image";
import { DownloadButton } from "@/components/download-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type DetailedSong, EntityType } from "@/types/entity";

interface SongHeaderProps {
	song: DetailedSong;
	onPlay: () => void;
	onAddToQueue: () => void;
}

/**
 * Displays song hero section with album art, metadata, and action buttons
 */
export function SongHeader({ song, onPlay, onAddToQueue }: SongHeaderProps) {
	return (
		<motion.div
			initial="hidden"
			animate="show"
			transition={{ staggerChildren: 0.1 }}
		>
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-6">
						{/* Album Art */}
						<motion.div
							className="w-full md:w-64 shrink-0"
							variants={{
								hidden: { opacity: 0, scale: 0.9 },
								show: { opacity: 1, scale: 1 },
							}}
						>
							{song.image && song.image.length > 0 ? (
								<ProgressiveImage
									images={song.image}
									alt={song.name}
									entityType={EntityType.SONG}
									rounded="default"
									priority
									objectFit="contain"
									fill={false}
									width={256}
									height={256}
								/>
							) : (
								<div className="flex aspect-square h-full w-full items-center justify-center bg-muted rounded-lg">
									<Music className="h-24 w-24 text-muted-foreground" />
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
									Song
								</Badge>
								<h1 className="text-4xl font-bold">{song.name}</h1>
							</div>

							<div className="space-y-2">
								<div>
									<span className="text-sm text-muted-foreground">
										Artists:{" "}
									</span>
									{song.artists?.primary?.map((artist, index) => (
										<span key={artist.id}>
											<Link
												href={`/artist?id=${artist.id}`}
												className="text-sm hover:underline"
											>
												{artist.name}
											</Link>
											{index < song.artists.primary.length - 1 && ", "}
										</span>
									))}
								</div>

								{song.album?.name && (
									<div>
										<span className="text-sm text-muted-foreground">
											Album:{" "}
										</span>
										{song.album.id ? (
											<Link
												href={`/album?id=${song.album.id}`}
												className="text-sm hover:underline"
											>
												{song.album.name}
											</Link>
										) : (
											<span className="text-sm">{song.album.name}</span>
										)}
									</div>
								)}

								<div className="flex gap-4 text-sm text-muted-foreground">
									{song.year && <span>{song.year}</span>}
									{song.language && (
										<span className="capitalize">{song.language}</span>
									)}
									{song.duration && (
										<span>
											{Math.floor(song.duration / 60)}:
											{(song.duration % 60).toString().padStart(2, "0")}
										</span>
									)}
								</div>

								{song.hasLyrics && (
									<Badge variant="outline">Lyrics Available</Badge>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2">
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button size="lg" onClick={onPlay} className="gap-2">
										<Play className="h-5 w-5" />
										Play
									</Button>
								</motion.div>
								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button
										size="lg"
										variant="outline"
										onClick={onAddToQueue}
										className="gap-2"
									>
										<Plus className="h-5 w-5" />
										Add to Queue
									</Button>
								</motion.div>
								<DownloadButton song={song} size="lg" />
							</div>
						</motion.div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
