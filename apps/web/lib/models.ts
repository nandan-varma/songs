interface ArtistRef {
	id: string;
	name: string;
}

export interface Track {
	id: string;
	title: string;
	artists: ArtistRef[];
	album: { id: string; name: string } | null;
	image: string;
	audioUrl: string;
	duration: number;
}

type CardKind = "album" | "artist" | "playlist";

export interface Card {
	id: string;
	kind: CardKind;
	title: string;
	subtitle?: string;
	image: string;
}
