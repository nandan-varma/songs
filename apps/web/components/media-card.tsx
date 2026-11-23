import Link from "next/link";
import { Cover } from "@/components/cover";
import type { Card } from "@/lib/models";
import { cn } from "@/lib/utils";

function MediaCard({ card }: { card: Card }) {
	return (
		<Link href={`/${card.kind}/${card.id}`} className="group block min-w-0">
			<Cover
				src={card.image}
				alt=""
				sizes="(min-width: 768px) 176px, 40vw"
				className={cn(
					"transition-opacity group-hover:opacity-80",
					card.kind === "artist" && "rounded-full",
				)}
			/>
			<p className="mt-2 truncate text-sm font-medium">{card.title}</p>
			{card.subtitle && (
				<p className="truncate text-xs text-muted-foreground">
					{card.subtitle}
				</p>
			)}
		</Link>
	);
}

export function CardGrid({ cards }: { cards: Card[] }) {
	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{cards.map((card) => (
				<MediaCard key={`${card.kind}:${card.id}`} card={card} />
			))}
		</div>
	);
}
