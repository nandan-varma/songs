import Link from "next/link";
import { CardGrid } from "@/components/media-card";
import { Section } from "@/components/section";
import { TrackList } from "@/components/track-list";
import { getHome } from "@/lib/api/data";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/utils";

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<{ lang?: string }>;
}) {
	const { lang } = await searchParams;
	const language = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
	const home = await getHome(language);

	return (
		<div className="space-y-10">
			<nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Language">
				{LANGUAGES.map((name) => (
					<Link
						key={name}
						href={name === DEFAULT_LANGUAGE ? "/" : `/?lang=${name}`}
						className={cn(
							"rounded-full bg-secondary px-3 py-1 text-sm capitalize whitespace-nowrap",
							name === language && "bg-primary text-primary-foreground",
						)}
					>
						{name}
					</Link>
				))}
			</nav>
			<Section title="Trending songs">
				<TrackList tracks={home.songs} />
			</Section>
			<Section title="Trending albums">
				<CardGrid cards={home.albums} />
			</Section>
			<Section title="Featured playlists">
				<CardGrid cards={home.playlists} />
			</Section>
			<Section title="Charts">
				<CardGrid cards={home.charts} />
			</Section>
		</div>
	);
}
