import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { artistMapSchema, toCredits } from "./lib/credit";
import { audioLinks, imageLinks } from "./lib/media";
import {
	flag,
	lenientArray,
	maybe,
	numeric,
	parseUpstream,
	text,
} from "./lib/schema";
import { jiosaavn } from "./lib/upstream";
import { count, linkQuery, query } from "./lib/validate";

const songSchema = z
	.object({
		id: z.string(),
		title: text,
		type: z.string(),
		perma_url: z.string(),
		image: z.string(),
		language: z.string(),
		year: maybe(z.string()),
		play_count: numeric,
		explicit_content: flag,
		more_info: z.object({
			album_id: maybe(z.string()),
			album: maybe(text),
			album_url: maybe(z.string()),
			label: maybe(text),
			duration: numeric,
			release_date: maybe(z.string()),
			has_lyrics: z.string().default("false"),
			lyrics_id: maybe(z.string()),
			copyright_text: maybe(text),
			encrypted_media_url: maybe(z.string()),
			artistMap: artistMapSchema,
		}),
	})
	.transform((song, ctx) => {
		let downloadUrl: ReturnType<typeof audioLinks>;
		try {
			downloadUrl = audioLinks(song.more_info.encrypted_media_url);
		} catch {
			ctx.addIssue({
				code: "custom",
				message: "undecryptable encrypted_media_url",
			});
			return z.NEVER;
		}
		return {
			id: song.id,
			name: song.title,
			type: song.type,
			year: song.year,
			releaseDate: song.more_info.release_date,
			duration: song.more_info.duration,
			label: song.more_info.label,
			explicitContent: song.explicit_content,
			playCount: song.play_count,
			language: song.language,
			hasLyrics: song.more_info.has_lyrics === "true",
			lyricsId: song.more_info.lyrics_id,
			url: song.perma_url,
			copyright: song.more_info.copyright_text,
			album: {
				id: song.more_info.album_id,
				name: song.more_info.album,
				url: song.more_info.album_url,
			},
			artists: toCredits(song.more_info.artistMap),
			image: imageLinks(song.image),
			downloadUrl,
		};
	});

export const songList = (resource: string) =>
	lenientArray(songSchema, resource);

const songsPayload = z.object({ songs: songList("songs") });

const lyricsSchema = z
	.object({
		lyrics: text,
		snippet: maybe(text),
		lyrics_copyright: maybe(text),
	})
	.transform((lyrics) => ({
		lyrics: lyrics.lyrics,
		snippet: lyrics.snippet,
		copyright: lyrics.lyrics_copyright,
	}));

async function getSongs(call: string, params: Record<string, string>) {
	const data = await jiosaavn(call, params);
	const { songs } = parseUpstream(songsPayload, data, call);
	if (songs.length === 0)
		throw new HTTPException(404, { message: "song not found" });
	return songs;
}

const byIds = (ids: string) => getSongs("song.getDetails", { pids: ids });

export const songs = new Hono()
	.get(
		"/",
		query(
			z.union([z.object({ ids: z.string().min(1) }), linkQuery("song")], {
				error: "either ids or a valid jiosaavn.com song link is required",
			}),
		),
		async (c) => {
			const q = c.req.valid("query");
			const data =
				"ids" in q
					? await byIds(q.ids)
					: await getSongs("webapi.get", { token: q.link, type: "song" });
			return c.json({ success: true as const, data });
		},
	)
	.get("/:id", async (c) =>
		c.json({ success: true as const, data: await byIds(c.req.param("id")) }),
	)
	.get("/:id/suggestions", query(z.object({ limit: count(10) })), async (c) => {
		const id = c.req.param("id");
		const { limit } = c.req.valid("query");
		const data = await jiosaavn("reco.getreco", { pid: id }, "android");
		const recommended = parseUpstream(
			z.record(z.string(), songList("reco.getreco")),
			data,
			"reco.getreco",
		);
		return c.json({
			success: true as const,
			data: (recommended[id] ?? []).slice(0, limit),
		});
	})
	.get("/:id/lyrics", async (c) => {
		const data = await jiosaavn("lyrics.getLyrics", {
			lyrics_id: c.req.param("id"),
		});
		const lyrics = lyricsSchema.safeParse(data);
		if (!lyrics.success) {
			throw new HTTPException(404, { message: "lyrics not found" });
		}
		return c.json({ success: true as const, data: lyrics.data });
	});
