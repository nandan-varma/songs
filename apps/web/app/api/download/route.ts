const CDN_SUFFIX = ".saavncdn.com";
const FALLBACK_EXTENSION = "mp4";

function parseCdnUrl(value: string | null): URL | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		const trusted =
			url.protocol === "https:" && url.hostname.endsWith(CDN_SUFFIX);
		return trusted ? url : null;
	} catch {
		return null;
	}
}

function safeFilename(name: string, source: URL): string {
	const extension = /\.([a-z0-9]{2,4})$/i.exec(source.pathname)?.[1];
	const base = name
		.replace(/[\\/:*?"<>|\p{Cc}]/gu, "")
		.replace(/\s+/g, " ")
		.trim();
	return `${base || "song"}.${extension ?? FALLBACK_EXTENSION}`;
}

export async function GET(request: Request) {
	const params = new URL(request.url).searchParams;
	const source = parseCdnUrl(params.get("url"));
	if (!source) return new Response("Invalid url", { status: 400 });

	const upstream = await fetch(source);
	if (!upstream.ok || !upstream.body) {
		return new Response("Upstream unavailable", { status: 502 });
	}

	const filename = safeFilename(params.get("name") ?? "", source);
	const headers = new Headers({
		"Content-Type": upstream.headers.get("content-type") ?? "audio/mp4",
		"Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(filename)}`,
	});
	const length = upstream.headers.get("content-length");
	if (length) headers.set("Content-Length", length);

	return new Response(upstream.body, { headers });
}
