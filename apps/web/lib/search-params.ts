import { debounce, parseAsString, parseAsStringLiteral } from "nuqs";

export const SEARCH_TYPES = [
	"all",
	"songs",
	"albums",
	"artists",
	"playlists",
] as const;

export const queryParam = parseAsString.withDefault("").withOptions({
	history: "replace",
	limitUrlUpdates: debounce(250),
});

export const typeParam = parseAsStringLiteral(SEARCH_TYPES)
	.withDefault("all")
	.withOptions({ history: "push" });
