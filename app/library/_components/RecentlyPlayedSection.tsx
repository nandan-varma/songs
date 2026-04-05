import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DetailedSong } from "@/types/entity";
import { LibrarySongItem } from "./LibrarySongItem";

interface RecentlyPlayedSectionProps {
	songs: DetailedSong[];
	onPlaySong: (index: number) => void;
	onClear: () => void;
}

export function RecentlyPlayedSection({
	songs,
	onPlaySong,
	onClear,
}: RecentlyPlayedSectionProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 pb-2 md:pb-6">
				<CardTitle className="flex items-center gap-2">
					<History className="h-5 w-5" />
					Recently Played
				</CardTitle>
				{songs.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClear}
						aria-label="Clear history"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</CardHeader>
			<CardContent className="p-2 md:p-6 md:pt-0">
				{songs.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No recently played songs yet.
					</p>
				) : (
					<ScrollArea className="h-[300px]">
						<div className="space-y-1">
							{songs.slice(0, 10).map((song, index) => (
								<LibrarySongItem
									key={song.id}
									song={song}
									onClick={() => onPlaySong(index)}
								/>
							))}
							{songs.length > 10 && (
								<p className="py-2 text-center text-sm text-muted-foreground">
									And {songs.length - 10} more...
								</p>
							)}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
