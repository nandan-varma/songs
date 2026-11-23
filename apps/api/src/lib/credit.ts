import { z } from "zod";
import { imageLinks } from "./media";
import { text } from "./schema";

export const creditSchema = z
	.object({
		id: z.string(),
		name: text,
		role: z.string(),
		type: z.string(),
		image: z.string(),
		perma_url: z.string(),
	})
	.transform((artist) => ({
		id: artist.id,
		name: artist.name,
		role: artist.role,
		type: artist.type,
		image: imageLinks(artist.image),
		url: artist.perma_url,
	}));

export const artistMapSchema = z.object({
	primary_artists: z.array(creditSchema).default([]),
	featured_artists: z.array(creditSchema).default([]),
	artists: z.array(creditSchema).default([]),
});

export const toCredits = (map: z.output<typeof artistMapSchema>) => ({
	primary: map.primary_artists,
	featured: map.featured_artists,
	all: map.artists,
});
