import type { AppType } from "@songs/api";
import { hc } from "hono/client";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	(process.env.NODE_ENV === "production"
		? "https://saavn-api.nandanvarma.com"
		: "http://localhost:3001");

const REVALIDATE_SECONDS = 300;

export const api = hc<AppType>(API_URL, {
	fetch: (input: RequestInfo | URL, init?: RequestInit) =>
		fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS } }),
}).api;

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

type Envelope =
	| { success: true; data: unknown }
	| { success: false; message?: string };

type Request = { status: number; json(): Promise<Envelope> };

export type Payload<T> = T extends { success: true; data: infer D } ? D : never;

export async function unwrap<R extends Request>(
	request: Promise<R>,
): Promise<Payload<Awaited<ReturnType<R["json"]>>>> {
	const response = await request;
	const body = await response.json();
	if (!body.success) {
		throw new ApiError(body.message ?? "Request failed", response.status);
	}
	return body.data as Payload<Awaited<ReturnType<R["json"]>>>;
}
