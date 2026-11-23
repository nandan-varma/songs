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

async function searchPage<S extends z.ZodType>(
	call: string,
	results: S,
	q: z.output<typeof params>,
) {
	const data = await jiosaavn(call, { q: q.query, p: q.page + 1, n: q.limit });
	const page = parseUpstream(
		z.object({ total: z.number(), results: z.unknown() }),
		data,
		call,
	);
	return {
		success: true as const,
		data: {
			total: page.total,
			start: q.page * q.limit,
			results: parseUpstream(results, page.results, call),
		},
	};
}

export const search = new Hono()
	.get("/songs", query(params), async (c) =>
		c.json(
			await searchPage(
				"search.getResults",
				songList("search songs"),
				c.req.valid("query"),
			),
		),
	)
	.get("/albums", query(params), async (c) =>
		c.json(
			await searchPage(
				"search.getAlbumResults",
				lenientArray(searchAlbumSchema, "search albums"),
				c.req.valid("query"),
			),
		),
	)
	.get("/artists", query(params), async (c) =>
		c.json(
			await searchPage(
				"search.getArtistResults",
				lenientArray(creditSchema, "search artists"),
				c.req.valid("query"),
			),
		),
	)
	.get("/playlists", query(params), async (c) =>
		c.json(
			await searchPage(
				"search.getPlaylistResults",
				lenientArray(searchPlaylistSchema, "search playlists"),
				c.req.valid("query"),
			),
		),
	);
