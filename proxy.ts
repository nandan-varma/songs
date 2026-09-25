import { type NextRequest, NextResponse } from "next/server";
import { publicConfig } from "@/lib/config/public";

const apiOrigin = new URL(publicConfig.NEXT_PUBLIC_API_URL).origin;

export function proxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const isDev = process.env.NODE_ENV === "development";

	const cspHeader = `
		default-src 'self';
		script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
			isDev ? "'unsafe-eval'" : ""
		};
		style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
		img-src 'self' blob: data: https://*.saavncdn.com https://www.jiosaavn.com;
		media-src 'self' blob: https://*.saavncdn.com;
		connect-src 'self' ${apiOrigin} https://*.saavncdn.com ${isDev ? "ws:" : ""};
		worker-src 'self';
		font-src 'self';
		object-src 'none';
		base-uri 'self';
		form-action 'self';
		frame-ancestors 'none';
		upgrade-insecure-requests;
	`
		.replace(/\s{2,}/g, " ")
		.trim();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
	response.headers.set("Content-Security-Policy", cspHeader);

	return response;
}

export const config = {
	matcher: [
		{
			source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
