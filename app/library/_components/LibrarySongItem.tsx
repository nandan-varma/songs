import { Music } from "lucide-react";
import Image from "next/image";
import type { DetailedSong } from "@/types/entity";

interface LibrarySongItemProps {
	song: DetailedSong;
	onClick?: () => void;
}

export function LibrarySongItem({ song, onClick }: LibrarySongItemProps) {
	const artistNames = song.artists.all.map((artist) => artist.name).join(", ");

	return (
		<button
			type="button"
			className="group flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/50"
			onClick={onClick}
		>
			{song.image && song.image.length > 0 ? (
				<div className="relative h-10 w-10 shrink-0">
					<Image
						src={song.image[0]?.url || song.image[1]?.url || ""}
						alt={song.name}
						fill
						sizes="40px"
						className="rounded object-cover"
					/>
				</div>
			) : (
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
					<Music className="h-5 w-5 text-muted-foreground" />
				</div>
			)}
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{song.name}</p>
				<p className="truncate text-sm text-muted-foreground">
					{artistNames || song.album?.name}
				</p>
			</div>
		</button>
	);
}
