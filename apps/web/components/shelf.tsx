import { Play } from "lucide-react";
import Link from "next/link";
import { Cover } from "@/components/cover";
import type { ImageLink } from "@/lib/models";
import { cn } from "@/lib/utils";

export interface ShelfCardData {
	id: string;
	title: string;
	subtitle?: string;
	image: ImageLink[];
	href: string;
	round?: boolean;
	station?: boolean;
}

function ShelfCard({ item }: { item: ShelfCardData }) {
	return (
		<Link
			href={item.href}
			className="group block w-36 shrink-0 snap-start sm:w-40 lg:w-44"
		>
			<div className="relative">
				<Cover
					src={item.image}
					alt=""
					sizes="176px"
					className={cn(
						"shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg",
						item.round && "rounded-full",
					)}
				/>
				{item.station && (
					<span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-background/80 text-foreground opacity-0 shadow backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
						<Play className="size-4 fill-current" />
					</span>
				)}
			</div>
			<p
				className={cn(
					"mt-2 truncate text-sm font-medium",
					item.round && "text-center",
				)}
			>
				{item.title}
			</p>
			{item.subtitle && (
				<p
					className={cn(
						"truncate text-xs text-muted-foreground",
						item.round && "text-center",
					)}
				>
					{item.subtitle}
				</p>
			)}
		</Link>
	);
}

export function ShelfRow({ items }: { items: ShelfCardData[] }) {
	return (
		<div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
			<div className="flex snap-x snap-mandatory gap-4 scroll-smooth">
				{items.map((item) => (
					<ShelfCard key={item.id} item={item} />
				))}
			</div>
		</div>
	);
}

export function GenreTiles({ items }: { items: ShelfCardData[] }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{items.map((item, index) => (
				<Link
					key={item.id}
					href={item.href}
					style={{ ["--hue" as string]: `${(index * 47) % 360}` }}
					className="group relative flex aspect-[16/9] items-end overflow-hidden rounded-xl bg-[oklch(0.6_0.17_var(--hue))] p-3 text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
				>
					<span className="relative z-10 text-base font-semibold drop-shadow">
						{item.title}
					</span>
					<div className="absolute -right-4 -bottom-4 w-2/5 rotate-[24deg] overflow-hidden rounded-md shadow-xl transition duration-300 group-hover:rotate-[18deg] group-hover:scale-105">
						<Cover
							src={item.image}
							alt=""
							sizes="120px"
							className="rounded-none"
						/>
					</div>
				</Link>
			))}
		</div>
	);
}
