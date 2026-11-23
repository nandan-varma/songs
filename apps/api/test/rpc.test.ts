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
