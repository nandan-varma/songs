import {
	ArtistRole,
	AudioQuality,
	EntityType,
	ImageQuality,
} from "@/types/entity";
import type {
	AlbumMini,
	ArtistMini,
	DetailedAlbum,
	DetailedArtist,
	DetailedPlaylist,
	DetailedSong,
	DownloadUrl,
	Image,
	Language,
	LocalPlaylist,
} from "@/types/entity";

const DEFAULT_IMAGE: Image = {
	quality: ImageQuality.MEDIUM,
	url: "https://example.com/image.jpg",
};

const DEFAULT_DOWNLOAD_URL: DownloadUrl = {
	quality: AudioQuality.HIGH,
	url: "https://example.com/audio.mp3",
};

const _DEFAULT_ARTIST: ArtistMini = {
	id: "artist1",
	name: "Test Artist",
	role: ArtistRole.PRIMARY,
	type: EntityType.ARTIST,
	image: [DEFAULT_IMAGE],
	url: "https://example.com/artist",
};

const _DEFAULT_ALBUM_MINI: AlbumMini = {
	id: "album1",
	name: "Test Album",
	url: "https://example.com/album",
};

export interface SongOverrides {
	id?: string;
	name?: string;
	year?: string | null;
	releaseDate?: string | null;
	duration?: number | null;
	language?: Language | string;
	image?: Image[];
	downloadUrl?: DownloadUrl[];
	artists?: {
		primary: ArtistMini[];
		featured: ArtistMini[];
		all: ArtistMini[];
	};
	album?: AlbumMini;
}

export function createImage(overrides: Partial<Image> = {}): Image {
	return {
		quality: ImageQuality.MEDIUM,
		url: "https://example.com/image.jpg",
		...overrides,
	};
}

export function createDownloadUrl(
	overrides: Partial<DownloadUrl> = {},
): DownloadUrl {
	return {
		quality: AudioQuality.HIGH,
		url: "https://example.com/audio.mp3",
		...overrides,
	};
}

export function createArtistMini(
	overrides: Partial<ArtistMini> = {},
): ArtistMini {
	return {
		id: "artist1",
		name: "Test Artist",
		role: ArtistRole.PRIMARY,
		type: EntityType.ARTIST,
		image: [DEFAULT_IMAGE],
		url: "https://example.com/artist",
		...overrides,
	};
}

export function createAlbumMini(overrides: Partial<AlbumMini> = {}): AlbumMini {
	return {
		id: "album1",
		name: "Test Album",
		url: "https://example.com/album",
		...overrides,
	};
}

export function createDetailedSong(
	overrides: SongOverrides = {},
): DetailedSong {
	const id = overrides.id ?? "song1";
	return {
		id,
		name: overrides.name ?? "Test Song",
		type: EntityType.SONG,
		year: overrides.year ?? "2024",
		releaseDate: overrides.releaseDate ?? "2024-01-01",
		duration: overrides.duration ?? 180,
		label: "Test Label",
		explicitContent: false,
		playCount: 1000,
		language: overrides.language ?? Language.HINDI,
		hasLyrics: true,
		lyricsId: "lyrics1",
		url: `https://example.com/song/${id}`,
		copyright: "2024 Test",
		album: overrides.album ?? createAlbumMini(),
		artists: overrides.artists ?? {
			primary: [createArtistMini({ name: "Primary Artist" })],
			featured: [],
			all: [createArtistMini({ name: "Primary Artist" })],
		},
		image: overrides.image ?? [DEFAULT_IMAGE],
		downloadUrl: overrides.downloadUrl ?? [DEFAULT_DOWNLOAD_URL],
	};
}

export function createDetailedAlbum(
	overrides: Partial<Omit<DetailedAlbum, "songs">> & {
		songs?: DetailedSong[];
	} = {},
): DetailedAlbum {
	const id = overrides.id ?? "album1";
	return {
		id,
		name: overrides.name ?? "Test Album",
		description: "Test album description",
		year: 2024,
		type: EntityType.ALBUM,
		playCount: 5000,
		language: Language.HINDI,
		explicitContent: false,
		artists: {
			primary: [createArtistMini({ name: "Album Artist" })],
			featured: [],
			all: [createArtistMini({ name: "Album Artist" })],
		},
		songCount: 10,
		url: `https://example.com/album/${id}`,
		image: [DEFAULT_IMAGE],
		songs: overrides.songs ?? [],
	};
}

export function createDetailedArtist(
	overrides: Partial<DetailedArtist> = {},
): DetailedArtist {
	const id = overrides.id ?? "artist1";
	return {
		id,
		name: "Test Artist",
		url: `https://example.com/artist/${id}`,
		type: EntityType.ARTIST,
		image: [DEFAULT_IMAGE],
		followerCount: 10000,
		fanCount: "5000",
		isVerified: true,
		dominantLanguage: Language.HINDI,
		dominantType: EntityType.SONG,
		bio: null,
		dob: null,
		fb: "https://facebook.com/test",
		twitter: "https://twitter.com/test",
		wiki: "https://wikipedia.org/test",
		availableLanguages: ["hindi", "english"],
		isRadioPresent: true,
		topSongs: null,
		topAlbums: null,
		singles: null,
		similarArtists: null,
		...overrides,
	};
}

export function createDetailedPlaylist(
	overrides: Partial<DetailedPlaylist> = {},
): DetailedPlaylist {
	const id = overrides.id ?? "playlist1";
	return {
		id,
		name: "Test Playlist",
		description: "Test playlist description",
		year: 2024,
		type: EntityType.PLAYLIST,
		playCount: 1000,
		language: Language.HINDI,
		explicitContent: false,
		songCount: 5,
		url: `https://example.com/playlist/${id}`,
		image: [DEFAULT_IMAGE],
		songs: [],
		artists: [createArtistMini()],
		...overrides,
	};
}

export function createLocalPlaylist(
	overrides: Partial<Omit<LocalPlaylist, "songs">> & {
		songs?: DetailedSong[];
	} = {},
): LocalPlaylist {
	const id = overrides.id ?? "local1";
	const now = Date.now();
	return {
		id,
		name: "My Playlist",
		songs: overrides.songs ?? [],
		createdAt: overrides.createdAt ?? now,
		updatedAt: overrides.updatedAt ?? now,
		...overrides,
	};
}

export const TEST_SONG = createDetailedSong();
export const TEST_SONG_2 = createDetailedSong({
	id: "song2",
	name: "Second Song",
});
export const TEST_ALBUM = createDetailedAlbum();
export const TEST_ARTIST = createDetailedArtist();
export const TEST_PLAYLIST = createDetailedPlaylist();
