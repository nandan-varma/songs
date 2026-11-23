import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const query = <S extends z.ZodType>(schema: S) =>
	zValidator("query", schema, (result, c) => {
		if (!result.success) {
			const message = result.error.issues
				.map((issue) => issue.message)
				.join("; ");
			return c.json({ success: false as const, message }, 400);
		}
	});

export const count = (fallback: number) =>
	z
		.string()
		.regex(/^\d+$/, "must be a non-negative integer")
		.transform(Number)
		.default(fallback);

const linkToken = (kind: string, path = kind) =>
	z.string().transform((value, ctx) => {
		const pattern = new RegExp(`jiosaavn\\.com/(?:${path})/[^/]+/([^/?#]+)/?$`);
		const token = pattern.exec(value)?.[1];
		if (!token) {
			ctx.addIssue({
				code: "custom",
				message: `not a jiosaavn.com ${kind} link`,
			});
			return z.NEVER;
		}
		return token;
	});

export const linkQuery = (kind: string, path = kind) =>
	z.object({ link: linkToken(kind, path) });

export const byIdOrLink = (kind: string, path = kind) =>
	z.union([z.object({ id: z.string().min(1) }), linkQuery(kind, path)], {
		error: `either id or a valid jiosaavn.com ${kind} link is required`,
	});
