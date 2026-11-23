import { Hono } from "hono";
import { z } from "zod";
import { albumSchema } from "./albums";
import { imageLinks } from "./lib/media";
import { lenientArray, maybe, parseUpstream, text } from "./lib/schema";
import { jiosaavn } from "./lib/upstream";
import { query } from "./lib/validate";
import { playlistSchema } from "./playlists";
import { songList } from "./songs";

const trendingSchemas = {
	song: songList("trending songs"),
	album: lenientArray(albumSchema, "trending albums"),
	playlist: lenientArray(playlistSchema, "trending playlists"),
};

const chartSchema = z
	.object({
		id: z.string(),
		title: text,
		image: z.string(),
		type: z.string(),
		count: z.number().nullish(),
		perma_url: z.string(),
		language: maybe(z.string()),
	})
	.transform((chart) => ({
		id: chart.id,
		name: chart.title,
		image: imageLinks(chart.image),
		type: chart.type,
		songCount: chart.count ?? null,
		url: chart.perma_url,
		language: chart.language,
	}));

export const browse = new Hono()
	.get(
		"/trending",
		query(
			z.object({
				type: z.enum(["song", "album", "playlist"]),
				language: z.string().min(1),
			}),
		),
		async (c) => {
			const { type, language } = c.req.valid("query");
			const call = "content.getTrending";
			const data = await jiosaavn(call, {
				entity_type: type,
				entity_language: language,
			});
			return c.json({
				success: true as const,
				data: parseUpstream(trendingSchemas[type], data, call),
			});
		},
	)
	.get("/charts", async (c) => {
		const call = "content.getCharts";
		const data = await jiosaavn(call);
		return c.json({
			success: true as const,
			data: parseUpstream(lenientArray(chartSchema, "charts"), data, call),
		});
	});
