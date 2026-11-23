import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { artistMapSchema, toCredits } from "./lib/credit.js";
import { imageLinks } from "./lib/media.js";
import { flag, maybe, numeric, parseUpstream, text } from "./lib/schema.js";
import { jiosaavn } from "./lib/upstream.js";
import { byIdOrLink, query } from "./lib/validate.js";
import { songList } from "./songs.js";

export const albumSchema = z
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
		list: songList("album songs"),
		more_info: z.object({
			song_count: numeric,
			artistMap: artistMapSchema,
		}),
	})
	.transform((album) => ({
		id: album.id,
		name: album.title,
		description: album.header_desc,
		type: album.type,
		year: album.year,
		playCount: album.play_count,
		language: album.language,
		explicitContent: album.explicit_content,
		url: album.perma_url,
		songCount: album.more_info.song_count,
		artists: toCredits(album.more_info.artistMap),
		image: imageLinks(album.image),
		songs: album.list,
	}));

export const albums = new Hono().get(
	"/",
	query(byIdOrLink("album")),
	async (c) => {
		const q = c.req.valid("query");
		const call = "id" in q ? "content.getAlbumDetails" : "webapi.get";
		const data = await jiosaavn(
			call,
			"id" in q ? { albumid: q.id } : { token: q.link, type: "album" },
		);
		const album = parseUpstream(albumSchema, data, call);
		if (!album.id) throw new HTTPException(404, { message: "album not found" });
		return c.json({ success: true as const, data: album });
	},
);
