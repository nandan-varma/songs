import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { albumSchema } from "./albums";
import { imageLinks } from "./lib/media";
import {
	lenientArray,
	maybe,
	numeric,
	parseUpstream,
	text,
} from "./lib/schema";
import { jiosaavn } from "./lib/upstream";
import { byIdOrLink, count, query } from "./lib/validate";
import { songList } from "./songs";

const bioEntrySchema = z.object({
	text: z.string().nullable(),
	title: z.string().nullable(),
	sequence: z.number().nullable(),
});

function parseBio(bio: string | unknown[]) {
	if (typeof bio !== "string" || !bio) return null;
	try {
		const parsed = bioEntrySchema.array().safeParse(JSON.parse(bio));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

const similarArtistSchema = z
	.object({
		id: z.string(),
		name: text,
		perma_url: z.string(),
		image_url: z.string(),
		type: z.string(),
	})
	.transform((artist) => ({
		id: artist.id,
		name: artist.name,
		url: artist.perma_url,
		image: imageLinks(artist.image_url),
		type: artist.type,
	}));

const artistSchema = z
	.object({
		artistId: maybe(z.string()),
		id: z.string().optional(),
		name: text,
		image: z.string(),
		follower_count: numeric,
		type: z.string(),
		isVerified: maybe(z.boolean()),
		dominantLanguage: maybe(z.string()),
		dominantType: maybe(z.string()),
		bio: z.union([z.string(), z.array(z.unknown())]).default([]),
		topSongs: songList("artist topSongs"),
		topAlbums: lenientArray(albumSchema, "artist topAlbums"),
		singles: songList("artist singles"),
		similarArtists: lenientArray(similarArtistSchema, "artist similarArtists"),
		urls: z.object({ overview: z.string() }).optional(),
		perma_url: z.string().optional(),
	})
	.transform((artist) => ({
		id: artist.artistId || artist.id || "",
		name: artist.name,
		url: artist.urls?.overview || artist.perma_url || "",
		type: artist.type,
		image: imageLinks(artist.image),
		followerCount: artist.follower_count,
		isVerified: artist.isVerified,
		dominantLanguage: artist.dominantLanguage,
		dominantType: artist.dominantType,
		bio: parseBio(artist.bio),
		topSongs: artist.topSongs,
		topAlbums: artist.topAlbums,
		singles: artist.singles,
		similarArtists: artist.similarArtists,
	}));

const topSongsSchema = z.object({
	topSongs: z.object({ total: z.number(), songs: songList("artist songs") }),
});

const topAlbumsSchema = z.object({
	topAlbums: z.object({
		total: z.number(),
		albums: lenientArray(albumSchema, "artist albums"),
	}),
});

const sorting = (order: "asc" | "desc") => ({
	page: count(0),
	sortBy: z
		.enum(["popularity", "latest", "alphabetical"])
		.default("popularity"),
	sortOrder: z.enum(["asc", "desc"]).default(order),
});

const sortParams = (q: {
	sortBy: string;
	sortOrder: string;
	page: number;
}) => ({
	page: q.page,
	category: q.sortBy,
	sort_order: q.sortOrder,
});

const listing = z.object({
	...sorting("asc"),
	songCount: count(10),
	albumCount: count(10),
});

async function getArtist(
	who: { id: string } | { link: string },
	options: z.output<typeof listing>,
) {
	const call = "id" in who ? "artist.getArtistPageDetails" : "webapi.get";
	const data = await jiosaavn(call, {
		...("id" in who
			? { artistId: who.id }
			: { token: who.link, type: "artist" }),
		n_song: options.songCount,
		n_album: options.albumCount,
		...sortParams(options),
	});
	const artist = parseUpstream(artistSchema, data, call);
	if (!artist.name) {
		throw new HTTPException(404, { message: "artist not found" });
	}
	return artist;
}

export const artists = new Hono()
	.get("/", query(z.intersection(byIdOrLink("artist"), listing)), async (c) => {
		const q = c.req.valid("query");
		return c.json({ success: true as const, data: await getArtist(q, q) });
	})
	.get("/:id", query(listing), async (c) => {
		const data = await getArtist(
			{ id: c.req.param("id") },
			c.req.valid("query"),
		);
		return c.json({ success: true as const, data });
	})
	.get("/:id/songs", query(z.object(sorting("desc"))), async (c) => {
		const call = "artist.getArtistMoreSong";
		const data = await jiosaavn(call, {
			artistId: c.req.param("id"),
			...sortParams(c.req.valid("query")),
		});
		const { topSongs } = parseUpstream(topSongsSchema, data, call);
		return c.json({ success: true as const, data: topSongs });
	})
	.get("/:id/albums", query(z.object(sorting("desc"))), async (c) => {
		const call = "artist.getArtistMoreAlbum";
		const data = await jiosaavn(call, {
			artistId: c.req.param("id"),
			...sortParams(c.req.valid("query")),
		});
		const { topAlbums } = parseUpstream(topAlbumsSchema, data, call);
		return c.json({ success: true as const, data: topAlbums });
	});
