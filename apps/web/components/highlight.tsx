const escapeRegExp = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function Highlight({ text, query }: { text: string; query?: string }) {
	const needle = query?.trim();
	if (!needle) return text;
	const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "i"));
	let offset = 0;
	return parts.map((part, index) => {
		const key = offset;
		offset += part.length;
		return index % 2 === 1 ? (
			<mark
				key={key}
				className="bg-transparent font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-2"
			>
				{part}
			</mark>
		) : (
			part
		);
	});
}
