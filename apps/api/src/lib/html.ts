const NAMED: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

export function decodeEntities(value: string): string {
	if (!value.includes("&")) return value;
	return value.replace(
		/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
		(entity, dec?: string, hex?: string, name?: string) => {
			if (dec) return String.fromCodePoint(Number(dec));
			if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
			return NAMED[name?.toLowerCase() ?? ""] ?? entity;
		},
	);
}
