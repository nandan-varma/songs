import { hc } from "hono/client";
import { afterEach, expect, it, vi } from "vitest";
import type { AppType } from "../src/index";
import app from "../src/index";
import { fixture, mockUpstream } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

it("exposes typed routes through hono's RPC client", async () => {
	mockUpstream({ "song.getDetails": fixture("song-details") });
	const client = hc<AppType>("http://localhost", { fetch: app.request });

	const response = await client.api.songs[":id"].$get({
		param: { id: "3IoDK8qI" },
	});
	const body = await response.json();

	if (!("data" in body)) throw new Error("expected a success envelope");
	expect(body.data[0]?.name).toBe("Levitating");
});

it("types the combined search and the split trending routes", async () => {
	mockUpstream({
		"autocomplete.get": fixture("autocomplete"),
		"search.getResults": fixture("search-songs"),
		"search.getAlbumResults": fixture("search-albums"),
		"search.getArtistResults": fixture("search-artists"),
		"search.getPlaylistResults": fixture("search-playlists"),
		"content.getTrending": fixture("trending-songs"),
	});
	const client = hc<AppType>("http://localhost", { fetch: app.request });

	const search = await (
		await client.api.search.$get({ query: { query: "dua" } })
	).json();
	const trending = await (
		await client.api.trending.songs.$get({ query: { language: "hindi" } })
	).json();

	if (!("data" in search) || !("data" in trending)) {
		throw new Error("expected success envelopes");
	}
	expect(search.data.topResult?.type).toBe("artist");
	expect(search.data.songs[0]?.downloadUrl).toHaveLength(5);
	expect(search.data.albums[0]?.artists.primary).toBeDefined();
	expect(search.data.artists[0]?.role).toBe("Artist");
	expect(search.data.playlists[0]?.songCount).toBeDefined();
	expect(trending.data[0]?.name).toBeTypeOf("string");
});
