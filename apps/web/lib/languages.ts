export const LANGUAGES = [
	"hindi",
	"english",
	"punjabi",
	"tamil",
	"telugu",
	"marathi",
	"gujarati",
	"bengali",
	"kannada",
	"malayalam",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "hindi";

export function isLanguage(value: string | undefined): value is Language {
	return LANGUAGES.some((language) => language === value);
}
