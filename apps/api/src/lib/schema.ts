import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { decodeEntities } from "./html";

/** A string with HTML entities decoded, so clients never need to. */
export const text = z.string().transform(decodeEntities);

/** Upstream omits fields or sends `null` interchangeably; clients see `null` either way. */
export const maybe = <S extends z.ZodType>(schema: S) =>
	schema.nullish().transform((value): z.output<S> | null => value ?? null);

/** JioSaavn sends numbers as strings. */
export const numeric = z
	.string()
	.nullish()
	.transform((value) => (value ? Number(value) : null));

/** JioSaavn sends booleans as `"1"` / `"0"`. */
export const flag = z.string().transform((value) => value === "1");

/**
 * Parses each entry on its own and drops the ones that fail, so one malformed song never fails a batch.
 * Upstream sends `""` (or omits the key) for an empty list, which also yields `[]`.
 */
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

/** Validates a whole upstream payload. A shape mismatch is a 502: the upstream changed, not the caller. */
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
