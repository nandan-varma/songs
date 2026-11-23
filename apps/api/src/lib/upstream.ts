import { HTTPException } from "hono/http-exception";

const ENDPOINT = "https://www.jiosaavn.com/api.php";
const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

type Params = Record<string, string | number>;

/** `android` exposes a few calls the web context lacks (song recommendations). */
type Context = "web6dot0" | "android";

/** Calls JioSaavn's private `api.php` and returns the parsed JSON. Callers validate its shape. */
export async function jiosaavn(
	call: string,
	params: Params = {},
	context: Context = "web6dot0",
): Promise<unknown> {
	const url = new URL(ENDPOINT);
	url.searchParams.set("__call", call);
	url.searchParams.set("_format", "json");
	url.searchParams.set("_marker", "0");
	url.searchParams.set("api_version", "4");
	url.searchParams.set("ctx", context);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, String(value));
	}

	let response: Response;
	try {
		response = await fetch(url, {
			headers: { "User-Agent": USER_AGENT },
			signal: AbortSignal.timeout(10_000),
		});
	} catch (cause) {
		throw new HTTPException(502, {
			message: `JioSaavn ${call} request failed`,
			cause,
		});
	}

	if (!response.ok) {
		throw new HTTPException(502, {
			message: `JioSaavn ${call} returned ${response.status}`,
		});
	}
	try {
		return await response.json();
	} catch (cause) {
		throw new HTTPException(502, {
			message: `JioSaavn ${call} returned non-JSON`,
			cause,
		});
	}
}
