import { Hono } from "hono";
import { z } from "zod";
import { imageLinks } from "./lib/media.js";
import { maybe, parseUpstream, text } from "./lib/schema.js";
import { jiosaavn } from "./lib/upstream.js";
import { query } from "./lib/validate.js";

const SHELF_TYPES = new Set([
	"playlist",
	"album",
	"artist",
	"song",
	"radio_station",
	"channel",
]);

const tileSchema = z
	.object({
		id: z.string(),
		title: text,
		subtitle: maybe(text),
		type: z.string(),
		image: z.string(),
		perma_url: maybe(z.string()),
		language: maybe(z.string()),
		more_info: z.record(z.string(), z.unknown()).nullish(),
	})
	.transform((tile) => {
		const info = tile.more_info ?? {};
		const str = (key: string) =>
			typeof info[key] === "string" ? (info[key] as string) : null;
		return {
			id: tile.id,
			type: tile.type,
			name: tile.title,
			subtitle: tile.subtitle || null,
			image: imageLinks(tile.image),
			url: tile.perma_url,
			language: str("language") ?? (tile.language || null),
			color: str("color"),
			stationKind: str("featured_station_type"),
			stationQuery: str("query"),
			video: str("video_thumbnail"),
		};
	});

const moduleSchema = z.object({
	position: z.number(),
	title: text,
	subtitle: maybe(text),
});

const launchSchema = z
	.object({
		modules: z.record(z.string(), moduleSchema),
		browse_discover: z.array(z.unknown()).optional(),
	})
	.catchall(z.unknown());

type Tile = z.output<typeof tileSchema>;

function tiles(value: unknown): Tile[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry) => {
		const result = tileSchema.safeParse(entry);
		return result.success && SHELF_TYPES.has(result.data.type)
			? [result.data]
			: [];
	});
}

export function shelves(data: z.output<typeof launchSchema>) {
	return Object.entries(data.modules)
		.sort(([, a], [, b]) => a.position - b.position)
		.flatMap(([key, module]) => {
			const items = tiles(data[key]);
			return items.length
				? [{ key, title: module.title, subtitle: module.subtitle, items }]
				: [];
		});
}

export const launch = new Hono().get(
	"/launch",
	query(z.object({ languages: z.string().min(1).default("hindi") })),
	async (c) => {
		const call = "webapi.getLaunchData";
		const data = parseUpstream(
			launchSchema,
			await jiosaavn(call, {}, "web6dot0", c.req.valid("query").languages),
			call,
		);
		return c.json({
			success: true as const,
			data: { shelves: shelves(data), genres: tiles(data.browse_discover) },
		});
	},
);
