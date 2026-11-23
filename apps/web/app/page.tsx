import Link from "next/link";
import { Section } from "@/components/section";
import { ShelfRow } from "@/components/shelf";
import { SongList } from "@/components/song-list";
import { Button } from "@/components/ui/button";
import { getHome, getLaunch } from "@/lib/api/data";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from "@/lib/languages";

const HOME_HIDDEN = new Set(["charts", "new_albums", "radio", "artist_recos"]);

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<{ lang?: string }>;
}) {
	const { lang } = await searchParams;
	const language = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
	const [home, launch] = await Promise.all([
		getHome(language),
		getLaunch(language),
	]);

	return (
		<div className="space-y-10">
			<div className="space-y-1">
				<h1 className="text-3xl font-bold tracking-tight">Home</h1>
				<nav aria-label="Language" className="flex gap-2 overflow-x-auto py-2">
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
			</div>
			<Section title="Trending songs">
				<SongList tracks={home.songs} />
			</Section>
			{launch.shelves
				.filter((shelf) => !HOME_HIDDEN.has(shelf.key))
				.map((shelf) => (
					<Section key={shelf.key} title={shelf.title}>
						<ShelfRow items={shelf.items} />
					</Section>
				))}
			<Section
				title="Top charts"
				action={
					<Button asChild variant="ghost" size="sm">
						<Link href="/new">See all</Link>
					</Button>
				}
			>
				<ShelfRow
					items={home.charts.map((card) => ({
						id: `chart:${card.id}`,
						title: card.title,
						subtitle: card.subtitle,
						image: card.image,
						href: `/${card.kind}/${card.id}`,
					}))}
				/>
			</Section>
		</div>
	);
}
