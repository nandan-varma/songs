import { Hono } from "hono";
import { z } from "zod";
import { artistMapSchema, creditSchema, toCredits } from "./lib/credit.js";
import { imageLinks } from "./lib/media.js";
import {
	flag,
	lenientArray,
	maybe,
	numeric,
	parseUpstream,
	text,
} from "./lib/schema.js";
import { jiosaavn } from "./lib/upstream.js";
import { count, query } from "./lib/validate.js";
import { songList } from "./songs.js";

const searchAlbumSchema = z
	.object({
		id: z.string(),
		title: text,
		header_desc: maybe(text),
		type: z.string(),
		perma_url: z.string(),
		image: z.string(),
		language: z.string(),
		year: numeric,
		play_count: numeric,
		explicit_content: flag,
		more_info: z.object({ artistMap: artistMapSchema }),
	})
	.transform((album) => ({
		id: album.id,
		name: album.title,
		description: album.header_desc,
		year: album.year,
		type: album.type,
		playCount: album.play_count,
		language: album.language,
		explicitContent: album.explicit_content,
		artists: toCredits(album.more_info.artistMap),
		url: album.perma_url,
		image: imageLinks(album.image),
	}));

const searchPlaylistSchema = z
	.object({
		id: z.string(),
		title: text,
		type: z.string(),
		image: z.string(),
		perma_url: z.string(),
		explicit_content: flag,
		more_info: z.object({ song_count: numeric, language: z.string() }),
	})
	.transform((playlist) => ({
		id: playlist.id,
		name: playlist.title,
		type: playlist.type,
		image: imageLinks(playlist.image),
		url: playlist.perma_url,
		songCount: playlist.more_info.song_count,
		language: playlist.more_info.language,
		explicitContent: playlist.explicit_content,
	}));

const params = z.object({
	query: z.string().min(1),
	page: count(0),
	limit: count(10),
});

const searchCalls = {
	songs: ["search.getResults", songList("search songs")],
	albums: [
		"search.getAlbumResults",
		lenientArray(searchAlbumSchema, "search albums"),
	],
	artists: [
		"search.getArtistResults",
		lenientArray(creditSchema, "search artists"),
	],
	playlists: [
		"search.getPlaylistResults",
		lenientArray(searchPlaylistSchema, "search playlists"),
	],
} as const;

async function searchPage<S extends z.ZodType>(
	call: string,
	results: S,
	q: { query: string; page: number; limit: number },
) {
	const data = await jiosaavn(call, { q: q.query, p: q.page + 1, n: q.limit });
	const page = parseUpstream(
		z.object({ total: z.number(), results: z.unknown() }),
		data,
		call,
	);
	return {
		total: page.total,
		start: q.page * q.limit,
		results: parseUpstream(results, page.results, call),
	};
}

const topResultSchema = z
	.object({
		topquery: z.object({
			data: lenientArray(
				z.object({
					id: z.string(),
					title: text,
					type: z.enum(["song", "album", "artist", "playlist"]),
					description: maybe(text),
					image: z.string(),
				}),
				"autocomplete topquery",
			),
		}),
	})
	.transform(({ topquery }) => {
		const [top] = topquery.data;
		return top
			? {
					type: top.type,
					id: top.id,
					name: top.title,
					subtitle: top.description,
					image: imageLinks(top.image),
				}
			: null;
	});

const combinedParams = z.object({
	query: z.string().min(1),
	limit: count(6).pipe(z.number().min(1).max(20)),
});

export const search = new Hono()
	.get("/", query(combinedParams), async (c) => {
		const { query: term, limit } = c.req.valid("query");
		const request = { query: term, page: 0, limit };
		const autocomplete = "autocomplete.get";
		const [top, songs, albums, artists, playlists] = await Promise.all([
			jiosaavn(autocomplete, { query: term, n: 1 }),
			searchPage(...searchCalls.songs, request),
			searchPage(...searchCalls.albums, request),
			searchPage(...searchCalls.artists, request),
			searchPage(...searchCalls.playlists, request),
		]);
		const named = (card: { name: string }) =>
			card.name.toLowerCase() === term.toLowerCase();
		const exact = [
			...songs.results.map((card) => ({ type: "song" as const, card })),
			...albums.results.map((card) => ({ type: "album" as const, card })),
			...artists.results.map((card) => ({ type: "artist" as const, card })),
			...playlists.results.map((card) => ({ type: "playlist" as const, card })),
		].find((entry) => named(entry.card));
		const topResult =
			parseUpstream(topResultSchema, top, autocomplete) ??
			(exact && {
				type: exact.type,
				id: exact.card.id,
				name: exact.card.name,
				subtitle: null,
				image: exact.card.image,
			});
		return c.json({
			success: true as const,
			data: {
				topResult: topResult || null,
				songs: songs.results.slice(0, limit),
				albums: albums.results.slice(0, limit),
				artists: artists.results.slice(0, limit),
				playlists: playlists.results.slice(0, limit),
			},
		});
	})
	.get("/songs", query(params), async (c) =>
		c.json({
			success: true as const,
			data: await searchPage(...searchCalls.songs, c.req.valid("query")),
		}),
	)
	.get("/albums", query(params), async (c) =>
		c.json({
			success: true as const,
			data: await searchPage(...searchCalls.albums, c.req.valid("query")),
		}),
	)
	.get("/artists", query(params), async (c) =>
		c.json({
			success: true as const,
			data: await searchPage(...searchCalls.artists, c.req.valid("query")),
		}),
	)
	.get("/playlists", query(params), async (c) =>
		c.json({
			success: true as const,
			data: await searchPage(...searchCalls.playlists, c.req.valid("query")),
		}),
	);
