/**
 * Application constants
 */

/**
 * Valid navigation routes in the application
 * Used for type-safe routing with Next.js App Router
 */
export const VALID_ROUTES = [
	"/",
	"/library",
	"/downloads",
	"/favorites",
] as const;

export type ValidRoute = (typeof VALID_ROUTES)[number];

/**
 * Check if a route is valid
 */
export const isValidRoute = (route: unknown): route is ValidRoute => {
	return (
		typeof route === "string" && VALID_ROUTES.includes(route as ValidRoute)
	);
};

export const feature_flags = {
	Artist_page_singles_enabled: false,
};
