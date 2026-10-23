import type { EntityItem } from "@/components/common/entity-card";
import type { ArtistSearchResult, Chart, Image } from "@/types/entity";

interface AlbumLike {
	id: string;
	name: string;
	year: number | null;
	image: Image[];
	artists: { primary: { name: string }[]; all: { name: string }[] };
}

interface PlaylistLike {
	id: string;
	name: string;
	songCount: number | null;
	image: Image[];
}

const songCountLabel = (count: number | null): string | undefined =>
	count ? `${count} songs` : undefined;

export function albumToItem(album: AlbumLike): EntityItem {
	const artists =
		album.artists.primary.length > 0
			? album.artists.primary
			: album.artists.all;
	return {
		id: album.id,
		name: album.name,
		subtitle: [album.year, artists.map((artist) => artist.name).join(", ")]
			.filter(Boolean)
			.join(" · "),
		image: album.image,
	};
}

export function playlistToItem(playlist: PlaylistLike | Chart): EntityItem {
	return {
		id: playlist.id,
		name: playlist.name,
		subtitle: songCountLabel(playlist.songCount),
		image: playlist.image,
	};
}

export function artistToItem(artist: ArtistSearchResult): EntityItem {
	return {
		id: artist.id,
		name: artist.name,
		subtitle: artist.role,
		image: artist.image,
	};
}
