import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { query } from "./lib/validate.js";

const lrclibSchema = z.object({
	syncedLyrics: z.string().nullish(),
	plainLyrics: z.string().nullish(),
	duration: z.number().nullish(),
});

export function parseSynced(lrc: string) {
	return lrc.split("\n").flatMap((line) => {
		const match = /^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/.exec(line.trim());
		if (!match) return [];
		const time = Number(match[1]) * 60 + Number(match[2]);
		return [{ time, text: match[3] ?? "" }];
	});
}

export const lyrics = new Hono().get(
	"/lyrics",
	query(
		z.object({
			title: z.string().min(1),
			artist: z.string().min(1),
			duration: z.string().regex(/^\d+$/).optional(),
		}),
	),
	async (c) => {
		const q = c.req.valid("query");
		const params = new URLSearchParams({
			track_name: q.title,
			artist_name: q.artist,
		});
		if (q.duration) params.set("duration", q.duration);
		let response: Response;
		try {
			response = await fetch(`https://lrclib.net/api/get?${params}`, {
				headers: { "User-Agent": "modes-api" },
				signal: AbortSignal.timeout(8_000),
			});
		} catch (cause) {
			throw new HTTPException(502, { message: "lrclib request failed", cause });
		}
		if (response.status === 404) {
			return c.json({ success: true as const, data: null });
		}
		if (!response.ok) {
			throw new HTTPException(502, {
				message: `lrclib returned ${response.status}`,
			});
		}
		const parsed = lrclibSchema.safeParse(await response.json());
		if (!parsed.success) {
			throw new HTTPException(502, { message: "unexpected lrclib response" });
		}
		const { syncedLyrics, plainLyrics } = parsed.data;
		return c.json({
			success: true as const,
			data: {
				synced: syncedLyrics ? parseSynced(syncedLyrics) : null,
				plain: plainLyrics ?? null,
			},
		});
	},
);
