import { afterEach, describe, expect, it, vi } from "vitest";
import { fixture, get, mockUpstream } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

describe("songs", () => {
	it("returns songs by id with decoded names, playable links and the unchanged wire shape", async () => {
		const requests = mockUpstream({
			"song.getDetails": fixture("song-details"),
		});

		const { status, body, headers } = await get("/api/songs/3IoDK8qI");

		expect(status).toBe(200);
		expect(requests[0]?.searchParams.get("pids")).toBe("3IoDK8qI");
		expect(body).toMatchObject({
			success: true,
			data: [
				{
					id: "3IoDK8qI",
					name: "Levitating",
					type: "song",
					year: "2020",
					duration: 203,
					playCount: 21615252,
					explicitContent: true,
					hasLyrics: false,
					album: { id: "23241654", name: "Future Nostalgia" },
				},
			],
		});
		const [song] = (body.data as Record<string, unknown>[]) ?? [];
		expect(Object.keys(song ?? {}).sort()).toEqual(
			[
				"album",
				"artists",
				"copyright",
				"downloadUrl",
				"duration",
				"explicitContent",
				"hasLyrics",
				"id",
				"image",
				"label",
				"language",
				"lyricsId",
				"name",
				"playCount",
				"releaseDate",
				"type",
				"url",
				"year",
			].sort(),
		);
		expect(
			((song?.downloadUrl ?? []) as { quality: string }[]).map(
				(l) => l.quality,
			),
		).toEqual(["12kbps", "48kbps", "96kbps", "160kbps", "320kbps"]);
		expect(headers.get("access-control-allow-origin")).toBe("*");
		expect(headers.get("cache-control")).toBe(
			"s-maxage=300, stale-while-revalidate",
		);
	});

	it("looks songs up by ids and by link", async () => {
		const requests = mockUpstream({
			"song.getDetails": fixture("song-details"),
			"webapi.get": fixture("song-details"),
		});

		await get("/api/songs?ids=a,b");
		await get(
			"/api/songs?link=https://www.jiosaavn.com/song/houdini/OgwhbhtDRwM",
		);

		expect(requests[0]?.searchParams.get("pids")).toBe("a,b");
		expect(requests[1]?.searchParams.get("token")).toBe("OgwhbhtDRwM");
		expect(requests[1]?.searchParams.get("type")).toBe("song");
	});

	it("rejects a missing or foreign lookup with a 400 envelope", async () => {
		mockUpstream({});

		for (const path of [
			"/api/songs",
			"/api/songs?link=https://example.com/song/x/y",
		]) {
			const { status, body } = await get(path);
			expect(status).toBe(400);
			expect(body).toMatchObject({ success: false });
		}
	});

	it("404s when upstream finds no song", async () => {
		mockUpstream({ "song.getDetails": { songs: [] } });

		const { status, body } = await get("/api/songs/nope");

		expect(status).toBe(404);
		expect(body).toEqual({ success: false, message: "song not found" });
	});

	it("skips a malformed song instead of failing the batch", async () => {
		const good = (fixture("song-details") as { songs: unknown[] }).songs[0];
		mockUpstream({
			"song.getDetails": { songs: [{ id: "broken" }, good] },
		});
		vi.spyOn(console, "warn").mockImplementation(() => {});

		const { status, body } = await get("/api/songs/a,b");

		expect(status).toBe(200);
		expect((body.data as { id: string }[]).map((s) => s.id)).toEqual([
			"3IoDK8qI",
		]);
	});

	it("skips a song whose media url cannot be decrypted", async () => {
		const [good] = (fixture("song-details") as { songs: unknown[] }).songs;
		const corrupt = structuredClone(good) as {
			id: string;
			more_info: { encrypted_media_url: string };
		};
		corrupt.id = "corrupt";
		corrupt.more_info.encrypted_media_url = "bm90LWRlcw==";
		mockUpstream({ "song.getDetails": { songs: [corrupt, good] } });
		vi.spyOn(console, "warn").mockImplementation(() => {});

		const { status, body } = await get("/api/songs/a,b");

		expect(status).toBe(200);
		expect((body.data as { id: string }[]).map((s) => s.id)).toEqual([
			"3IoDK8qI",
		]);
	});

	it("returns the songs that exist when some ids are unknown", async () => {
		const [good] = (fixture("song-details") as { songs: unknown[] }).songs;
		mockUpstream({ "song.getDetails": { songs: [good] } });

		const { status, body } = await get("/api/songs?ids=3IoDK8qI,unknown");

		expect(status).toBe(200);
		expect(body.data).toHaveLength(1);
	});

	it("limits suggestions to the requested count", async () => {
		const requests = mockUpstream({ "reco.getreco": fixture("reco") });

		const { body } = await get("/api/songs/3IoDK8qI/suggestions?limit=1");

		expect(requests[0]?.searchParams.get("ctx")).toBe("android");
		expect(body.data).toHaveLength(1);
	});

	it("returns an empty list when upstream has no recommendations", async () => {
		mockUpstream({ "reco.getreco": {} });

		const { body } = await get("/api/songs/3IoDK8qI/suggestions");

		expect(body).toEqual({ success: true, data: [] });
	});

	it("returns lyrics and 404s when there are none", async () => {
		mockUpstream({ "lyrics.getLyrics": fixture("lyrics") });
		const found = await get("/api/songs/aRZbUYD7/lyrics");
		expect(found.body).toMatchObject({
			success: true,
			data: { copyright: "Lyrics powered by JioSaavn" },
		});

		mockUpstream({ "lyrics.getLyrics": { status: "failure" } });
		expect((await get("/api/songs/x/lyrics")).status).toBe(404);
	});
});

describe("albums", () => {
	it("returns an album with its songs", async () => {
		const requests = mockUpstream({
			"content.getAlbumDetails": fixture("album-details"),
		});

		const { body } = await get("/api/albums?id=23241654");

		expect(requests[0]?.searchParams.get("albumid")).toBe("23241654");
		expect(body).toMatchObject({
			success: true,
			data: { id: "23241654", name: "Future Nostalgia", songCount: 13 },
		});
		expect((body.data as { songs: unknown[] }).songs).toHaveLength(2);
	});

	it("resolves an album link and 404s on a blank album", async () => {
		const requests = mockUpstream({ "webapi.get": fixture("album-details") });
		await get(
			"/api/albums?link=https://www.jiosaavn.com/album/future-nostalgia/ITIyo-GDr7A_",
		);
		expect(requests[0]?.searchParams.get("token")).toBe("ITIyo-GDr7A_");
		expect(requests[0]?.searchParams.get("type")).toBe("album");

		mockUpstream({
			"content.getAlbumDetails": {
				...(fixture("album-details") as object),
				id: "",
			},
		});
		expect((await get("/api/albums?id=zzz")).status).toBe(404);
	});
});

describe("artists", () => {
	it("returns an artist by id (path and query) with the default listing params", async () => {
		const requests = mockUpstream({
			"artist.getArtistPageDetails": fixture("artist-page"),
		});

		const { body } = await get("/api/artists/464932?songCount=2&albumCount=1");
		await get("/api/artists?id=464932");

		expect(body).toMatchObject({
			success: true,
			data: { id: "464932", name: "Neha Kakkar", followerCount: 24028403 },
		});
		const data = body.data as Record<string, unknown[]>;
		expect(data.topSongs).toHaveLength(2);
		expect(data.topAlbums).toHaveLength(1);
		expect(data.similarArtists?.[0]).toMatchObject({
			id: "459320",
			name: "Arijit Singh",
			type: "artist",
		});
		expect(requests[0]?.searchParams.get("artistId")).toBe("464932");
		expect(requests[0]?.searchParams.get("n_song")).toBe("2");
		expect(requests[0]?.searchParams.get("category")).toBe("popularity");
		expect(requests[0]?.searchParams.get("sort_order")).toBe("asc");
		expect(requests[1]?.searchParams.get("n_song")).toBe("10");
	});

	it("resolves an artist link", async () => {
		const requests = mockUpstream({ "webapi.get": fixture("artist-page") });

		await get(
			"/api/artists?link=https://www.jiosaavn.com/artist/neha-kakkar-songs/nxeN73VeoFk_&songCount=1",
		);

		expect(requests[0]?.searchParams.get("token")).toBe("nxeN73VeoFk_");
		expect(requests[0]?.searchParams.get("type")).toBe("artist");
	});

	it("pages an artist's songs and albums with sorting", async () => {
		const requests = mockUpstream({
			"artist.getArtistMoreSong": fixture("artist-songs"),
			"artist.getArtistMoreAlbum": fixture("artist-albums"),
		});

		const songs = await get(
			"/api/artists/464932/songs?page=2&sortBy=latest&sortOrder=asc",
		);
		const albums = await get("/api/artists/464932/albums");

		expect(songs.body.data).toMatchObject({ total: expect.any(Number) });
		expect((songs.body.data as { songs: unknown[] }).songs).toHaveLength(2);
		expect((albums.body.data as { albums: unknown[] }).albums).toHaveLength(1);
		expect(requests[0]?.searchParams.get("page")).toBe("2");
		expect(requests[0]?.searchParams.get("category")).toBe("latest");
		expect(requests[0]?.searchParams.get("sort_order")).toBe("asc");
		expect(requests[1]?.searchParams.get("sort_order")).toBe("desc");
	});

	it("rejects an invalid sort key", async () => {
		mockUpstream({});
		expect((await get("/api/artists/1/songs?sortBy=loudest")).status).toBe(400);
	});
});

describe("playlists", () => {
	it("returns a playlist page, offsetting the 0-indexed page for upstream", async () => {
		const requests = mockUpstream({
			"playlist.getDetails": fixture("playlist-details"),
		});

		const { body } = await get("/api/playlists?id=82914609&page=0&limit=2");

		expect(requests[0]?.searchParams.get("listid")).toBe("82914609");
		expect(requests[0]?.searchParams.get("p")).toBe("1");
		expect(requests[0]?.searchParams.get("n")).toBe("2");
		expect(body).toMatchObject({
			success: true,
			data: { name: "Best of Indie - English", songCount: 2 },
		});
		expect((body.data as { songs: unknown[] }).songs).toHaveLength(2);
	});

	it("resolves featured and s/playlist links", async () => {
		const requests = mockUpstream({
			"webapi.get": fixture("playlist-details"),
		});

		await get(
			"/api/playlists?link=https://www.jiosaavn.com/featured/its-indie-english/AMoxtXyKHoU_",
		);
		await get(
			"/api/playlists?link=https://www.jiosaavn.com/s/playlist/abc/def/GHI_jkl",
		);

		expect(requests[0]?.searchParams.get("token")).toBe("AMoxtXyKHoU_");
		expect(requests[0]?.searchParams.get("type")).toBe("playlist");
	});
});

describe("search", () => {
	it("pages song results", async () => {
		const requests = mockUpstream({
			"search.getResults": fixture("search-songs"),
		});

		const { body } = await get("/api/search/songs?query=dua&page=1&limit=2");

		expect(requests[0]?.searchParams.get("q")).toBe("dua");
		expect(requests[0]?.searchParams.get("p")).toBe("2");
		expect(body).toMatchObject({ success: true, data: { start: 2 } });
		expect((body.data as { results: unknown[] }).results).toHaveLength(2);
	});

	it("decodes entities in search results", async () => {
		mockUpstream({ "search.getResults": fixture("search-songs") });

		const { body } = await get("/api/search/songs?query=dua");

		expect(JSON.stringify(body)).not.toMatch(/&amp;/);
	});

	it("returns albums, artists and playlists in their own shapes", async () => {
		mockUpstream({
			"search.getAlbumResults": fixture("search-albums"),
			"search.getArtistResults": fixture("search-artists"),
			"search.getPlaylistResults": fixture("search-playlists"),
		});

		const albums = await get("/api/search/albums?query=dua");
		const artists = await get("/api/search/artists?query=dua");
		const playlists = await get("/api/search/playlists?query=dua");

		const album = (albums.body.data as { results: Record<string, unknown>[] })
			.results[0];
		expect(album).toHaveProperty("artists.primary");
		expect(album).not.toHaveProperty("songs");
		expect(
			(artists.body.data as { results: unknown[] }).results[0],
		).toMatchObject({
			id: "1274170",
			name: "Dua Lipa",
			role: "Artist",
		});
		expect(
			(playlists.body.data as { results: unknown[] }).results[0],
		).toHaveProperty("songCount");
	});

	it("requires a query", async () => {
		mockUpstream({});
		expect((await get("/api/search/songs")).status).toBe(400);
	});
});

describe("trending and charts", () => {
	it("returns a plain list per entity kind", async () => {
		const requests = mockUpstream({
			"content.getTrending": fixture("trending-songs"),
		});
		const songs = await get("/api/trending/songs?language=hindi");
		expect(songs.body.data).toHaveLength(2);
		expect(requests[0]?.searchParams.get("entity_type")).toBe("song");
		expect(requests[0]?.searchParams.get("entity_language")).toBe("hindi");

		mockUpstream({ "content.getTrending": fixture("trending-albums") });
		const albums = await get("/api/trending/albums?language=hindi");
		expect(albums.body.data).toHaveLength(1);

		mockUpstream({ "content.getTrending": fixture("trending-playlists") });
		const playlists = await get("/api/trending/playlists?language=hindi");
		expect(playlists.body.data).toHaveLength(1);
	});

	it("requires a language and no longer serves the union route", async () => {
		mockUpstream({});
		expect((await get("/api/trending/songs")).status).toBe(400);
		expect((await get("/api/trending?type=song&language=hindi")).status).toBe(
			404,
		);
	});

	it("lists charts", async () => {
		mockUpstream({ "content.getCharts": fixture("charts") });

		const { body } = await get("/api/charts");

		expect(body).toMatchObject({
			success: true,
			data: [
				{
					name: "Hindi: India Superhits Top 50",
					songCount: 50,
					language: null,
				},
				{ name: "India Superhits Top 50" },
			],
		});
	});
});

describe("combined search", () => {
	const upstream = () =>
		mockUpstream({
			"autocomplete.get": fixture("autocomplete"),
			"search.getResults": fixture("search-songs"),
			"search.getAlbumResults": fixture("search-albums"),
			"search.getArtistResults": fixture("search-artists"),
			"search.getPlaylistResults": fixture("search-playlists"),
		});

	it("merges the typed searches, with the typed card shapes, and a top result", async () => {
		const requests = upstream();

		const combined = await get("/api/search?query=dua&limit=1");
		const songs = await get("/api/search/songs?query=dua");

		const data = combined.body.data as Record<string, unknown[]>;
		expect(combined.body.data).toMatchObject({
			topResult: {
				type: "artist",
				id: "459320",
				name: "Arijit Singh",
				subtitle: "Artist",
			},
		});
		expect(data.songs).toHaveLength(1);
		expect(data.songs?.[0]).toEqual(
			(songs.body.data as { results: unknown[] }).results[0],
		);
		expect(data.albums).toHaveLength(1);
		expect(data.artists).toHaveLength(1);
		expect(data.playlists).toHaveLength(1);
		expect(requests[0]?.searchParams.get("__call")).toBe("autocomplete.get");
	});

	it("falls back to an exact name match, then to null", async () => {
		mockUpstream({
			"autocomplete.get": { topquery: { data: [] } },
			"search.getResults": { total: 0, start: 0, results: [] },
			"search.getAlbumResults": { total: 0, start: 0, results: [] },
			"search.getArtistResults": fixture("search-artists"),
			"search.getPlaylistResults": { total: 0, start: 0, results: [] },
		});

		const exact = await get("/api/search?query=dua%20lipa");
		const none = await get("/api/search?query=nobody");

		expect(exact.body.data).toMatchObject({
			topResult: { type: "artist", id: "1274170", name: "Dua Lipa" },
		});
		expect(none.body.data).toMatchObject({ topResult: null });
	});

	it("validates query and limit", async () => {
		upstream();
		expect((await get("/api/search")).status).toBe(400);
		expect((await get("/api/search?query=a&limit=21")).status).toBe(400);
		expect((await get("/api/search?query=a&limit=0")).status).toBe(400);
	});
});

describe("errors", () => {
	it("answers unknown routes with a 404 envelope", async () => {
		const { status, body } = await get("/api/nope");
		expect(status).toBe(404);
		expect(body).toEqual({ success: false, message: "route not found" });
	});

	it("answers 502 when upstream changes shape", async () => {
		mockUpstream({ "content.getCharts": { not: "an array" } });
		vi.spyOn(console, "error").mockImplementation(() => {});

		const { status, body } = await get("/api/charts");

		expect(status).toBe(502);
		expect(body).toMatchObject({ success: false });
	});

	it("answers 502 when upstream is unreachable", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

		const { status } = await get("/api/charts");

		expect(status).toBe(502);
	});
});

describe("launch", () => {
	it("returns shelves in module order with normalised tiles and genre channels", async () => {
		const requests = mockUpstream({
			"webapi.getLaunchData": fixture("launch"),
		});

		const { status, body } = await get("/api/launch?languages=telugu,hindi");

		expect(status).toBe(200);
		expect(requests[0]?.searchParams.get("__call")).toBe(
			"webapi.getLaunchData",
		);
		const data = body.data as {
			shelves: {
				key: string;
				title: string;
				items: { id: string; name: string }[];
			}[];
			genres: { type: string }[];
		};
		expect(data.shelves[0]).toMatchObject({
			key: "new_trending",
			title: "Trending Now",
		});
		expect(data.shelves.map((s) => s.key)).toContain("radio");
		expect(data.genres[0]?.type).toBe("channel");
	});
});

describe("lyrics", () => {
	it("parses synced lyrics into timed lines", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					syncedLyrics: "[00:01.50] first\n[01:02.00] second\n[00:03.00]",
					plainLyrics: "first\nsecond",
				}),
			),
		);

		const { body } = await get("/api/lyrics?title=a&artist=b&duration=200");

		expect(body.data).toEqual({
			synced: [
				{ time: 1.5, text: "first" },
				{ time: 62, text: "second" },
				{ time: 3, text: "" },
			],
			plain: "first\nsecond",
		});
	});

	it("returns null data when lrclib has no track", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("{}", { status: 404 })),
		);

		const { status, body } = await get("/api/lyrics?title=a&artist=b");

		expect(status).toBe(200);
		expect(body.data).toBeNull();
	});
});
