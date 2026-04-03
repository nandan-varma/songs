import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface BuildInfo {
	id: string;
	timestamp: number;
	version: string;
	git: {
		commit?: string;
		branch?: string;
	};
	env: string;
}

function generateBuildInfo(): BuildInfo {
	const isDev = process.env.NODE_ENV === "development";
	const timestamp = Date.now();

	// Generate unique build ID
	const buildId = `${timestamp}-${Math.random().toString(36).slice(2, 9)}`;

	// Get git info if available
	const gitInfo: BuildInfo["git"] = {};
	try {
		gitInfo.commit = execSync("git rev-parse --short HEAD", {
			encoding: "utf-8",
		}).trim();
		gitInfo.branch = execSync("git rev-parse --abbrev-ref HEAD", {
			encoding: "utf-8",
		}).trim();
	} catch {
		// Git info not available (e.g., Docker build)
	}

	const buildInfo: BuildInfo = {
		id: buildId,
		timestamp,
		version: process.env.npm_package_version || "0.0.0",
		git: gitInfo,
		env: isDev ? "development" : "production",
	};

	return buildInfo;
}

// Generate and write build info
const buildInfo = generateBuildInfo();
const publicDir = path.join(process.cwd(), "public");
const buildInfoPath = path.join(publicDir, "build-info.json");

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
	fs.mkdirSync(publicDir, { recursive: true });
}

// Write build info
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log("[Build Info] Generated:", buildInfo);
