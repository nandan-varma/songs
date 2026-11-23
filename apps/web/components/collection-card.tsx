import Link from "next/link";
import { Cover } from "@/components/cover";
import { Highlight } from "@/components/highlight";
import type { Card } from "@/lib/models";
import { cn } from "@/lib/utils";

function CollectionCard({
	card,
	highlight,
}: {
	card: Card;
	highlight?: string;
}) {
	return (
		<Link
			href={`/${card.kind}/${card.id}`}
			data-result
			className="group block min-w-0 rounded-md data-[active=true]:bg-accent"
		>
			<Cover
				src={card.image}
				alt=""
				sizes="(min-width: 1024px) 160px, (min-width: 640px) 25vw, 45vw"
				className={cn(
					"transition-opacity duration-150 group-hover:opacity-80",
					card.kind === "artist" && "rounded-full",
				)}
			/>
			<p
				className={cn(
					"mt-2 truncate text-sm font-medium",
					card.kind === "artist" && "text-center",
				)}
			>
				<Highlight text={card.title} query={highlight} />
			</p>
			{card.subtitle && (
				<p className="truncate text-xs text-muted-foreground">
					{card.subtitle}
				</p>
			)}
		</Link>
	);
}

export function CollectionGrid({
	cards,
	highlight,
}: {
	cards: Card[];
	highlight?: string;
}) {
	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
			{cards.map((card) => (
				<CollectionCard
					key={`${card.kind}:${card.id}`}
					card={card}
					highlight={highlight}
				/>
			))}
		</div>
	);
}
