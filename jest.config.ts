import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
	coverageProvider: "v8",
	testEnvironment: "jsdom",
	// Add more setup options before each test is run
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	// Coverage configuration
	collectCoverageFrom: [
		"**/*.{ts,tsx}",
		"!**/*.d.ts",
		"!**/node_modules/**",
		"!**/.next/**",
		"!**/coverage/**",
		"!**/jest.config.ts",
		"!**/jest.setup.ts",
		"!**/__tests__/**",
		"!**/*.test.{ts,tsx}",
		"!**/*.spec.{ts,tsx}",
		"!**/types/**",
		"!**/public/**",
		"!**/scripts/**",
		"!**/components/ui/**",
	],
	// Coverage thresholds - disabled for now while building test coverage
	// coverageThreshold: {
	// 	global: {
	// 		branches: 40,
	// 		functions: 30,
	// 		lines: 20,
	// 		statements: 20,
	// 	},
	// },
	coverageReporters: ["text", "text-summary", "html", "lcov", "json"],
	coverageDirectory: "coverage",
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
