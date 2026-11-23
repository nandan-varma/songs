import Link from "next/link";
import { CollectionGrid } from "@/components/collection-card";
import { Section } from "@/components/section";
import { SongList } from "@/components/song-list";
import { Button } from "@/components/ui/button";
import { getHome } from "@/lib/api/data";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from "@/lib/languages";

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<{ lang?: string }>;
}) {
	const { lang } = await searchParams;
	const language = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
	const home = await getHome(language);

	return (
		<div className="space-y-8">
			<nav aria-label="Language" className="flex gap-2 overflow-x-auto">
				{LANGUAGES.map((name) => (
					<Button
						key={name}
						asChild
						variant="chip"
						size="sm"
						className="capitalize"
					>
						<Link
							href={name === DEFAULT_LANGUAGE ? "/" : `/?lang=${name}`}
							data-active={name === language}
							aria-current={name === language ? "true" : undefined}
						>
							{name}
						</Link>
					</Button>
				))}
			</nav>
			<Section title="Trending songs">
				<SongList tracks={home.songs} />
			</Section>
			<Section title="Trending albums">
				<CollectionGrid cards={home.albums} />
			</Section>
			<Section title="Featured playlists">
				<CollectionGrid cards={home.playlists} />
			</Section>
			<Section title="Charts">
				<CollectionGrid cards={home.charts} />
			</Section>
		</div>
	);
}
