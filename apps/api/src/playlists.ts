import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { creditSchema } from "./lib/credit.js";
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
import { byIdOrLink, count, query } from "./lib/validate.js";
import { songList } from "./songs.js";

export const playlistSchema = z
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
		list_count: numeric,
		list: songList("playlist songs"),
		more_info: z.object({
			artists: lenientArray(creditSchema, "playlist artists"),
		}),
	})
	.transform((playlist) => ({
		id: playlist.id,
		name: playlist.title,
		description: playlist.header_desc,
		type: playlist.type,
		year: playlist.year,
		playCount: playlist.play_count,
		language: playlist.language,
		explicitContent: playlist.explicit_content,
		songCount: playlist.list_count,
		url: playlist.perma_url,
		image: imageLinks(playlist.image),
		songs: playlist.list,
		artists: playlist.more_info.artists,
	}));

export const playlists = new Hono().get(
	"/",
	query(
		z.intersection(
			byIdOrLink("playlist", "featured|s/playlist"),
			z.object({ page: count(0), limit: count(10) }),
		),
	),
	async (c) => {
		const q = c.req.valid("query");
		const paging = { n: q.limit, p: q.page + 1 };
		const call = "id" in q ? "playlist.getDetails" : "webapi.get";
		const data = await jiosaavn(
			call,
			"id" in q
				? { listid: q.id, ...paging }
				: { token: q.link, type: "playlist", ...paging },
		);
		const playlist = parseUpstream(playlistSchema, data, call);
		if (!playlist.name) {
			throw new HTTPException(404, { message: "playlist not found" });
		}
		return c.json({ success: true as const, data: playlist });
	},
);
