import { z } from "zod";

// Zod Schemas
const ImageSchema = z.object({
  quality: z.string(),
  url: z.string(),
});

const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  type: z.string(),
  image: z.array(ImageSchema),
  url: z.string(),
});

const AlbumInfoSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  url: z.string().nullable(),
});

const AlbumSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string(),
  year: z.coerce.string().nullable(),
  type: z.string(),
  playCount: z.number().nullable(),
  language: z.string(),
  explicitContent: z.boolean(),
  artist: z.string().optional(),
  songIds: z.string().optional(),
  artists: z
    .object({
      primary: z.array(ArtistSchema),
      featured: z.array(ArtistSchema),
      all: z.array(ArtistSchema),
    })
    .optional(),
  url: z.string(),
  image: z.array(ImageSchema),
});

const ArtistSearchSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),
  type: z.string(),
  image: z.array(ImageSchema),
  url: z.string(),
  description: z.string().optional(),
  position: z.number().optional(),
});

const SongSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  title: z.string().optional(),
  type: z.string(),
  year: z.coerce.string().nullable(),
  releaseDate: z.string().nullable(),
  duration: z.number().nullable(),
  label: z.string().nullable(),
  explicitContent: z.boolean(),
  playCount: z.number().nullable(),
  language: z.string(),
  hasLyrics: z.boolean().optional(),
  lyricsId: z.string().nullable(),
  url: z.string(),
  copyright: z.string().nullable(),
  album: z.union([AlbumInfoSchema, z.string()]).optional(),
  primaryArtists: z.string().optional(),
  singers: z.string().optional(),
  artists: z
    .object({
      primary: z.array(ArtistSchema),
      featured: z.array(ArtistSchema),
      all: z.array(ArtistSchema),
    })
    .optional(),
  image: z.array(ImageSchema),
  downloadUrl: z
    .array(
      z.object({
        quality: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});

const TopQueryResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.array(ImageSchema),
  type: z.string(),
  description: z.string().optional(),
});

const GlobalSearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    topQuery: z
      .object({
        results: z.array(TopQueryResultSchema),
        position: z.number(),
      })
      .optional(),
    songs: z
      .object({
        results: z.array(SongSchema),
        position: z.number(),
      })
      .optional(),
    albums: z
      .object({
        results: z.array(AlbumSchema),
        position: z.number(),
      })
      .optional(),
    artists: z
      .object({
        results: z.array(ArtistSearchSchema),
        position: z.number(),
      })
      .optional(),
    playlists: z
      .object({
        results: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            image: z.array(ImageSchema),
            url: z.string(),
            songCount: z.number().nullable(),
            language: z.string(),
            explicitContent: z.boolean(),
          }),
        ),
        position: z.number(),
      })
      .optional(),
  }),
});

const SongsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total: z.number(),
    start: z.number(),
    results: z.array(SongSchema),
  }),
});

const AlbumsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total: z.number(),
    start: z.number(),
    results: z.array(AlbumSchema),
  }),
});

const ArtistsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total: z.number(),
    start: z.number(),
    results: z.array(ArtistSearchSchema),
  }),
});

const PlaylistsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    total: z.number(),
    start: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        image: z.array(ImageSchema),
        url: z.string(),
        songCount: z.number().nullable(),
        language: z.string(),
        explicitContent: z.boolean(),
      }),
    ),
  }),
});

// Type exports
export type Song = z.infer<typeof SongSchema>;
export type Album = z.infer<typeof AlbumSchema>;
export type Artist = z.infer<typeof ArtistSearchSchema>;
export type SongsResponse = z.infer<typeof SongsResponseSchema>;
export type AlbumsResponse = z.infer<typeof AlbumsResponseSchema>;
export type ArtistsResponse = z.infer<typeof ArtistsResponseSchema>;

// Legacy interfaces for backward compatibility
export interface LegacySong {
  id: string;
  title: string;
  image: string;
  artists: string[];
  album: string;
  duration: string;
  downloadUrl?: Array<{ quality: string; url: string }>;
}

export interface Playlist {
  id: string;
  name: string;
  type: string;
  image: string;
  url: string;
  songCount: number | null;
  language: string;
  explicitContent: boolean;
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: Array<{
      id: string;
      name: string;
      image: Array<{ quality: string; url: string }>;
      artists: {
        primary: Array<{ name: string }>;
      };
      album: {
        name: string;
      };
      duration: number;
      downloadUrl?: Array<{ quality: string; url: string }>;
    }>;
  };
}

export interface PlaylistSearchResponse {
  success: boolean;
  data: {
    results: Array<{
      id: string;
      name: string;
      type: string;
      image: Array<{ quality: string; url: string }>;
      url: string;
      songCount: number | null;
      language: string;
      explicitContent: boolean;
    }>;
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function mapSongFromAPI(song: Song): LegacySong {
  const name = song.name || song.title || "";
  const albumName =
    typeof song.album === "string" ? song.album : song.album?.name || "";
  const artists = song.primaryArtists
    ? song.primaryArtists.split(", ")
    : song.artists?.primary.map((a) => a.name) || [];
  return {
    id: song.id,
    title: name,
    image:
      song.image.find((img) => img.quality === "50x50")?.url ||
      song.image[0]?.url ||
      "",
    artists: artists,
    album: albumName,
    duration: song.duration ? formatDuration(song.duration) : "",
    downloadUrl: song.downloadUrl,
  };
}

function mapPlaylistFromAPI(playlist: any): Playlist {
  return {
    id: playlist.id,
    name: playlist.name || playlist.title || "",
    type: playlist.type,
    image:
      playlist.image.find((img) => img.quality === "50x50")?.url ||
      playlist.image[0]?.url ||
      "",
    url: playlist.url,
    songCount: playlist.songCount || null,
    language: playlist.language,
    explicitContent: playlist.explicitContent || false,
  };
}

export async function searchSongs(
  query: string,
  page: number = 0,
  limit: number = 10,
  apiUrl: string = "https://saavn-api.nandanvarma.com",
): Promise<LegacySong[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${apiUrl}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    const json = await response.json();
    console.log("Songs search API response:", json);
    const parsed = SongsResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Zod parse error:", parsed.error);
      return [];
    }
    const data = parsed.data;

    if (data.success && data.data.results.length) {
      return data.data.results.map(mapSongFromAPI);
    }
    return [];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

export async function searchAlbums(
  query: string,
  page: number = 0,
  limit: number = 10,
  apiUrl: string = "https://saavn-api.nandanvarma.com",
): Promise<Album[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${apiUrl}/api/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    const json = await response.json();
    console.log("Albums search API response:", json);
    const parsed = AlbumsResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Zod parse error:", parsed.error);
      return [];
    }
    const data = parsed.data;

    if (data.success && data.data.results.length) {
      return data.data.results;
    }
    return [];
  } catch (error) {
    console.error("Albums search failed:", error);
    return [];
  }
}

export async function searchArtists(
  query: string,
  page: number = 0,
  limit: number = 10,
  apiUrl: string = "https://saavn-api.nandanvarma.com",
): Promise<Artist[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${apiUrl}/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    const json = await response.json();
    console.log("Artists search API response:", json);
    const parsed = ArtistsResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Zod parse error:", parsed.error);
      return [];
    }
    const data = parsed.data;

    if (data.success && data.data.results.length) {
      return data.data.results;
    }
    return [];
  } catch (error) {
    console.error("Artists search failed:", error);
    return [];
  }
}

export async function searchPlaylists(
  query: string,
  page: number = 0,
  limit: number = 10,
  apiUrl: string = "https://saavn-api.nandanvarma.com",
): Promise<Playlist[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${apiUrl}/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    const json = await response.json();
    console.log("Playlists search API response:", json);
    const parsed = PlaylistsResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Zod parse error:", parsed.error);
      return [];
    }
    const data = parsed.data;

    if (data.success && data.data.results.length) {
      return data.data.results.map(mapPlaylistFromAPI);
    }
    return [];
  } catch (error) {
    console.error("Playlist search failed:", error);
    return [];
  }
}

export async function globalSearch(
  query: string,
  apiUrl: string = "https://saavn-api.nandanvarma.com",
): Promise<z.infer<typeof GlobalSearchResponseSchema>["data"] | null> {
  if (!query.trim()) return null;

  try {
    const response = await fetch(
      `${apiUrl}/api/search?query=${encodeURIComponent(query)}`,
    );
    const json = await response.json();
    console.log("Global search API response:", json);
    const parsed = GlobalSearchResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Zod parse error:", parsed.error);
      return null;
    }
    const data = parsed.data;

    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Global search failed:", error);
    return null;
  }
}
