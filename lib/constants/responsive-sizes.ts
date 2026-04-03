/**
 * Responsive Size Constants
 * Centralized Tailwind classes for consistent responsive layout sizing across the app
 * Use these instead of hardcoding responsive classes throughout components
 */

export const RESPONSIVE_SIZES = {
	// Grid layouts
	grid: {
		songs:
			"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
		albums:
			"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
		artists:
			"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
		playlists: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4",
		compact: "grid grid-cols-1 gap-2",
	},

	// Dialog/Modal widths
	modal: {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		full: "max-w-[calc(100%-2rem)]",
	},

	// Padding/Spacing responsive
	padding: {
		section: "p-6 md:p-12",
		card: "p-4 sm:p-6",
		compact: "p-2 sm:p-3",
		spacious: "p-6 sm:p-8 md:p-12",
	},

	// Gap/Spacing between items
	gap: {
		tight: "gap-1.5 sm:gap-2.5",
		normal: "gap-2 sm:gap-3 md:gap-4",
		relaxed: "gap-4 sm:gap-6",
	},

	// Text sizing
	text: {
		xs: "text-xs sm:text-xs",
		sm: "text-sm sm:text-sm md:text-base",
		base: "text-base sm:text-base md:text-lg",
		lg: "text-lg sm:text-xl md:text-2xl",
		xl: "text-xl sm:text-2xl md:text-3xl",
	},

	// Drawer/Sheet widths (for mobile-first)
	drawer: {
		width: "w-3/4 sm:max-w-sm",
	},

	// Breakpoint utilities
	breakpoints: {
		sm: "640px",
		md: "768px",
		lg: "1024px",
		xl: "1280px",
		"2xl": "1536px",
	},

	// Flex layouts for responsive stacking
	flex: {
		stackMobile: "flex flex-col sm:flex-row",
		centerBetween: "flex items-center justify-between gap-2 sm:gap-4",
		wrap: "flex flex-wrap gap-2 sm:gap-3",
	},

	// Container constraints
	container: {
		full: "w-full",
		maxSmall: "max-w-2xl",
		maxMedium: "max-w-4xl",
		maxLarge: "max-w-6xl",
		maxXLarge: "max-w-7xl",
	},
} as const;

/**
 * Helper function to merge responsive class strings
 * @param classes - Array of class strings to merge
 * @returns Combined class string
 */
export const mergeResponsiveClasses = (...classes: (string | undefined)[]) => {
	return classes.filter(Boolean).join(" ");
};
