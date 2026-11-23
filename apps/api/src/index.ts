import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { albums } from "./albums.js";
import { artists } from "./artists.js";
import { browse } from "./browse.js";
import { playlists } from "./playlists.js";
import { search } from "./search.js";
import { songs } from "./songs.js";

const app = new Hono()
	.basePath("/api")
	.use(
		cors({
			origin: "*",
			allowMethods: ["GET", "OPTIONS"],
			allowHeaders: ["*"],
		}),
	)
	.use(async (c, next) => {
		await next();
		if (c.res.ok) {
			c.header("Cache-Control", "s-maxage=300, stale-while-revalidate");
		}
	})
	.route("/songs", songs)
	.route("/albums", albums)
	.route("/artists", artists)
	.route("/playlists", playlists)
	.route("/search", search)
	.route("/", browse);

app.notFound((c) =>
	c.json({ success: false as const, message: "route not found" }, 404),
);

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		return c.json(
			{ success: false as const, message: error.message },
			error.status,
		);
	}
	console.error(error);
	return c.json(
		{ success: false as const, message: "internal server error" },
		500,
	);
});

export type AppType = typeof app;

export default app;
