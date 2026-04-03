/**
 * Deployment utilities for cache busting
 */

export interface BuildInfo {
	id: string;
	timestamp: number;
	version: string;
	git: {
		commit?: string;
		branch?: string;
	};
	env: string;
}

// Cache for build info to avoid multiple fetches
let cachedBuildInfo: BuildInfo | null = null;

/**
 * Fetch current build info
 */
export async function getBuildInfo(): Promise<BuildInfo> {
	try {
		const response = await fetch("/build-info.json", {
			cache: "no-store",
			headers: { "Cache-Control": "no-cache" },
		});

		if (!response.ok) {
			throw new Error(`Build info fetch failed: ${response.status}`);
		}

		const data = (await response.json()) as BuildInfo;
		cachedBuildInfo = data;
		return data;
	} catch (error) {
		console.warn("[Deployment] Failed to fetch build info:", error);
		// Return a fallback if fetch fails
		return (
			cachedBuildInfo || {
				id: "unknown",
				timestamp: 0,
				version: "0.0.0",
				git: {},
				env: "unknown",
			}
		);
	}
}

/**
 * Check if a new deployment has been detected
 */
export async function checkForNewDeployment(
	previousBuildId: string,
): Promise<boolean> {
	const currentBuildInfo = await getBuildInfo();
	return currentBuildInfo.id !== previousBuildId;
}

/**
 * Format build info for display
 */
export function formatBuildInfo(buildInfo: BuildInfo): string {
	const date = new Date(buildInfo.timestamp).toLocaleString();
	const commit = buildInfo.git.commit ? ` (${buildInfo.git.commit})` : "";
	return `v${buildInfo.version} • ${date}${commit}`;
}
