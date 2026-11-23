import { readFileSync } from "node:fs";
import { vi } from "vitest";
import app from "../src/index";

export function fixture(name: string): unknown {
	return JSON.parse(
		readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
	);
}

/** Replaces `fetch` with canned upstream responses keyed by JioSaavn `__call`. Returns the requests seen. */
export function mockUpstream(responses: Record<string, unknown>) {
	const requests: URL[] = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: URL) => {
			requests.push(input);
			const call = input.searchParams.get("__call") ?? "";
			if (!(call in responses))
				throw new Error(`unexpected upstream call ${call}`);
			return Response.json(responses[call]);
		}),
	);
	return requests;
}

/** Requests `path` from the app and returns the status and JSON body. */
export async function get(path: string) {
	const response = await app.request(path);
	return {
		status: response.status,
		headers: response.headers,
		body: (await response.json()) as Record<string, unknown>,
	};
}
