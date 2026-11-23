import { execSync } from "node:child_process";

export function generateBuildInfo() {
	const timestamp = Date.now();
	const buildId = `${timestamp}-${Math.random().toString(36).slice(2, 9)}`;
	const git = {};

	try {
		git.commit = execSync("git rev-parse --short HEAD", {
			encoding: "utf-8",
		}).trim();
		git.branch = execSync("git rev-parse --abbrev-ref HEAD", {
			encoding: "utf-8",
		}).trim();
	} catch {
		// Git metadata is optional.
	}

	return {
		id: buildId,
		timestamp,
		version: process.env.npm_package_version || "0.0.0",
		git,
		env: process.env.NODE_ENV === "development" ? "development" : "production",
	};
}
