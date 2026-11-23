import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { decodeEntities } from "./html.js";

export const text = z.string().transform(decodeEntities);

export const maybe = <S extends z.ZodType>(schema: S) =>
	schema.nullish().transform((value): z.output<S> | null => value ?? null);

export const numeric = z
	.string()
	.nullish()
	.transform((value) => (value ? Number(value) : null));

export const flag = z.string().transform((value) => value === "1");

export const lenientArray = <S extends z.ZodType>(item: S, resource: string) =>
	z
		.unknown()
		.optional()
		.transform((value, ctx): z.output<S>[] => {
			if (value == null || value === "") return [];
			if (!Array.isArray(value)) {
				ctx.addIssue({ code: "custom", message: "expected an array" });
				return z.NEVER;
			}
			return value.flatMap((entry) => {
				const result = item.safeParse(entry);
				if (result.success) return [result.data];
				console.warn(
					`[${resource}] skipped malformed entry: ${describe(result.error)}`,
				);
				return [];
			});
		});

function describe(error: z.ZodError): string {
	return error.issues
		.map((issue) => `${issue.path.join(".")} ${issue.message}`)
		.join("; ");
}

export function parseUpstream<S extends z.ZodType>(
	schema: S,
	data: unknown,
	resource: string,
): z.output<S> {
	const result = schema.safeParse(data);
	if (!result.success) {
		const message = `unexpected response from JioSaavn for ${resource}: ${describe(result.error)}`;
		console.error(message);
		throw new HTTPException(502, { message });
	}
	return result.data;
}
