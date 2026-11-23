import { Cover } from "@/components/cover";
import { PlayButtons } from "@/components/play-buttons";
import type { ImageLink, Track } from "@/lib/models";
import { cn } from "@/lib/utils";

interface CollectionHeaderProps {
	title: string;
	subtitle?: string;
	meta?: string;
	image: ImageLink[];
	tracks: Track[];
	round?: boolean;
	children?: React.ReactNode;
}

export function CollectionHeader({
	title,
	subtitle,
	meta,
	image,
	tracks,
	round,
	children,
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
				<div className="flex items-center gap-2">
					<PlayButtons tracks={tracks} />
					{children}
				</div>
			</div>
		</header>
	);
}
