import Link from "next/link";
import { Section } from "@/components/section";
import { ShelfRow } from "@/components/shelf";
import { SongList } from "@/components/song-list";
import { Button } from "@/components/ui/button";
import { getHome, getLaunch } from "@/lib/api/data";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from "@/lib/languages";

export const metadata = { title: "New" };

export default async function NewPage({
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
	const releases = launch.shelves.find((shelf) => shelf.key === "new_albums");
	const charts = launch.shelves.find((shelf) => shelf.key === "charts");
	const editors = launch.shelves.find((shelf) => shelf.key === "top_playlists");

	return (
		<div className="space-y-10">
			<div className="space-y-1">
				<h1 className="text-3xl font-bold tracking-tight">New</h1>
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
								href={name === DEFAULT_LANGUAGE ? "/new" : `/new?lang=${name}`}
								data-active={name === language}
								aria-current={name === language ? "true" : undefined}
							>
								{name}
							</Link>
						</Button>
					))}
				</nav>
			</div>
			{editors?.items[0] && (
				<Link
					href={editors.items[0].href}
					className="group relative block aspect-[16/8] overflow-hidden rounded-2xl bg-muted"
				>
					<img
						src={editors.items[0].image.at(-1)?.url}
						alt=""
						className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
					<div className="absolute inset-x-0 bottom-0 p-5 text-white">
						<p className="text-xs font-semibold tracking-wider uppercase opacity-80">
							From the editors
						</p>
						<p className="text-2xl font-bold">{editors.items[0].title}</p>
						{editors.items[0].subtitle && (
							<p className="text-sm opacity-85">{editors.items[0].subtitle}</p>
						)}
					</div>
				</Link>
			)}
			<Section title="Best new songs">
				<SongList tracks={home.songs.slice(0, 12)} />
			</Section>
			{releases && (
				<Section title={releases.title}>
					<ShelfRow items={releases.items} />
				</Section>
			)}
			{charts && (
				<Section title={charts.title}>
					<ShelfRow items={charts.items} />
				</Section>
			)}
		</div>
	);
}
