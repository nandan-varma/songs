import { Hono } from "hono";
import { z } from "zod";
import { albumSchema } from "./albums.js";
import { imageLinks } from "./lib/media.js";
import { lenientArray, maybe, parseUpstream, text } from "./lib/schema.js";
import { jiosaavn } from "./lib/upstream.js";
import { query } from "./lib/validate.js";
import { playlistSchema } from "./playlists.js";
import { songList } from "./songs.js";

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

const trendingQuery = query(z.object({ language: z.string().min(1) }));

async function trending<S extends z.ZodType>(
	entityType: string,
	schema: S,
	language: string,
) {
	const call = "content.getTrending";
	const data = await jiosaavn(call, {
		entity_type: entityType,
		entity_language: language,
	});
	return { success: true as const, data: parseUpstream(schema, data, call) };
}

export const browse = new Hono()
	.get("/trending/songs", trendingQuery, async (c) =>
		c.json(
			await trending(
				"song",
				songList("trending songs"),
				c.req.valid("query").language,
			),
		),
	)
	.get("/trending/albums", trendingQuery, async (c) =>
		c.json(
			await trending(
				"album",
				lenientArray(albumSchema, "trending albums"),
				c.req.valid("query").language,
			),
		),
	)
	.get("/trending/playlists", trendingQuery, async (c) =>
		c.json(
			await trending(
				"playlist",
				lenientArray(playlistSchema, "trending playlists"),
				c.req.valid("query").language,
			),
		),
	)
	.get("/charts", async (c) => {
		const call = "content.getCharts";
		const data = await jiosaavn(call);
		return c.json({
			success: true as const,
			data: parseUpstream(lenientArray(chartSchema, "charts"), data, call),
		});
	});
