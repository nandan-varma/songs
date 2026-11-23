import { Cover } from "@/components/cover";
import { PlayButtons } from "@/components/play-buttons";
import type { Track } from "@/lib/models";
import { cn } from "@/lib/utils";

interface CollectionHeaderProps {
	title: string;
	subtitle?: string;
	meta?: string;
	image: string;
	tracks: Track[];
	round?: boolean;
}

/** Cover, titles and play actions shared by album, playlist, artist and song pages. */
export function CollectionHeader({
	title,
	subtitle,
	meta,
	image,
	tracks,
	round,
}: CollectionHeaderProps) {
	return (
		<header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
			<Cover
				src={image}
				alt=""
				sizes="(min-width: 640px) 224px, 60vw"
				priority
				className={cn("w-3/5 shrink-0 sm:w-56", round && "rounded-full")}
			/>
			<div className="min-w-0 space-y-3">
				<h1 className="text-2xl font-bold sm:text-4xl">{title}</h1>
				{subtitle && <p className="text-muted-foreground">{subtitle}</p>}
				{meta && <p className="text-sm text-muted-foreground">{meta}</p>}
				<PlayButtons tracks={tracks} />
			</div>
		</header>
	);
}
