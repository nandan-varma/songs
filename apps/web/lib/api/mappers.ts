import type { InferResponseType } from "hono/client";
import type { Card, Track } from "@/lib/models";
import type { api, Payload } from "./client";

type Data<E extends { $get: (...args: never[]) => unknown }> = Payload<
	InferResponseType<E["$get"]>
>;

type SongWire = Data<(typeof api.songs)[":id"]>[number];

interface Link {
	url: string;
}

export const best = (links: Link[]) => links.at(-1)?.url ?? "";

const joinNames = (people: { name: string }[]) =>
	people.map((person) => person.name).join(", ");

export function toTrack(song: SongWire): Track | null {
	const audioUrl = best(song.downloadUrl);
	if (!audioUrl) return null;
	const credits = song.artists.primary.length
		? song.artists.primary
		: song.artists.all;
	return {
		id: song.id,
		title: song.name,
		artists: uniqueById(credits.map(({ id, name }) => ({ id, name }))),
		album:
			song.album.id && song.album.name
				? { id: song.album.id, name: song.album.name }
				: null,
		image: best(song.image),
		audioUrl,
		duration: song.duration ?? 0,
	};
}

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
	return [...new Map(items.map((item) => [item.id, item])).values()];
}

export function toTracks(songs: SongWire[] | null | undefined): Track[] {
	return uniqueById((songs ?? []).flatMap((song) => toTrack(song) ?? []));
}

export function albumCard(album: {
	id: string;
	name: string;
	image: Link[];
	artists: { primary: { name: string }[] };
}): Card {
	return {
		id: album.id,
		kind: "album",
		title: album.name,
		subtitle: joinNames(album.artists.primary),
		image: best(album.image),
	};
}

export function playlistCard(playlist: {
	id: string;
	name: string;
	image: Link[];
	songCount: number | null;
}): Card {
	return {
		id: playlist.id,
		kind: "playlist",
		title: playlist.name,
		subtitle: playlist.songCount ? `${playlist.songCount} songs` : undefined,
		image: best(playlist.image),
	};
}

export function artistCard(artist: {
	id: string;
	name: string;
	image: Link[];
}): Card {
	return {
		id: artist.id,
		kind: "artist",
		title: artist.name,
		image: best(artist.image),
	};
}
