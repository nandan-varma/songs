import { Section } from "@/components/section";
import { GenreTiles, ShelfRow } from "@/components/shelf";
import { getLaunch } from "@/lib/api/data";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";

export const metadata = { title: "Browse" };

export default async function BrowsePage({
	searchParams,
}: {
	searchParams: Promise<{ lang?: string }>;
}) {
	const { lang } = await searchParams;
	const language = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
	const launch = await getLaunch(language);
	const stations = launch.shelves.find((shelf) => shelf.key === "radio");
	const artists = launch.shelves.find((shelf) => shelf.key === "artist_recos");

	return (
		<div className="space-y-10">
			<h1 className="text-3xl font-bold tracking-tight">Browse</h1>
			<Section title="Genres & moods">
				<GenreTiles items={launch.genres} />
			</Section>
			{stations && (
				<Section title="Stations">
					<ShelfRow items={stations.items} />
				</Section>
			)}
			{artists && (
				<Section title="Artist stations">
					<ShelfRow items={artists.items} />
				</Section>
			)}
		</div>
	);
}
