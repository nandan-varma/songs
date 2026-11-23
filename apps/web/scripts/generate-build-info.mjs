import fs from "node:fs";
import path from "node:path";
import { generateBuildInfo } from "./build-info.mjs";

const buildInfo = generateBuildInfo();
const publicDir = path.join(process.cwd(), "public");
const buildInfoPath = path.join(publicDir, "build-info.json");

if (!fs.existsSync(publicDir)) {
	fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log("[Build Info] Generated:", buildInfo);
