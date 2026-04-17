# AGENTS.md

This file is the working guide for coding agents operating in `/Users/nandan/dev/songs`.
It is based on the current repository state, scripts, and conventions in this codebase.

## Repository Overview

- Framework: `Next.js 16` App Router
- Language: `TypeScript` with strict mode
- Package manager: `pnpm` lockfile is present; use `pnpm install` for dependency changes
- Runtime commands: repo scripts are written for `npm run ...`
- Formatting and linting: `Biome`
- State: `Zustand`
- Server state: `@tanstack/react-query`
- URL state: `nuqs`
- Validation: `zod`
- Offline downloads: `idb-keyval`

## Rule Files

- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- Treat this file as the repository-specific agent guide.

## Install And Setup

- Install dependencies: `pnpm install`
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Start production server: `npm run start`
- Bundle analysis: `npm run analyze`
- Turbopack analysis: `npm run analyze:turbopack`

## Lint, Format, Typecheck

- Lint entire repo: `npm run lint`
- Format entire repo: `npx biome format --write .`
- Check one file with Biome: `npx biome check path/to/file.tsx`
- Format one file: `npx biome format --write path/to/file.tsx`
- There is no dedicated `typecheck` script.
- Use `npm run build` as the authoritative full-project typecheck + build verification.

## Test Commands

- Run tests: `npm run test`
- Run tests with coverage: `npm run test:coverage`
- Run in watch mode: `npm run test -- --watch`
- No dedicated "single test" command exists; use vitest's file filtering
- Test files are in `__tests__/` directory
- Use `npm run build` as the authoritative verification for non-trivial changes

## Verification Expectations

- For small isolated edits: run targeted `biome check` on touched files.
- For cross-cutting or architectural edits: run `npm run lint` and `npm run build`.
- If dependencies change: run `pnpm install` to sync the lockfile.
- After test changes: run `npm run test` to verify.

## General Code Style

- Use `TypeScript` everywhere possible.
- Follow Biome formatting; do not hand-format against it.
- Indentation uses tabs.
- Strings use double quotes.
- Keep files ASCII unless a file already uses Unicode and it is justified.
- Prefer concise code over clever abstractions.
- Prefer the smallest correct change.

## Imports

- Import order in practice is:
  - framework / third-party packages
  - internal `@/...` imports
  - local relative imports
- Prefer the `@/*` path alias over long relative paths.
- Prefer `import type` for type-only imports.
- Remove unused imports immediately; Biome flags them.
- Do not add wildcard barrel layers unless there is a real reuse need.

## Modules And File Layout

- Keep domain code separated by purpose:
  - `app/` for routes and route-local components
  - `components/` for reusable UI and feature components
  - `hooks/` for reusable React hooks
  - `lib/` for non-React domain logic and infrastructure
  - `types/` for shared type definitions
- For large route files, split into route-local `_components/`.
- Reuse shared shells before copying route state logic.
- Keep generated `components/ui/*` wrappers minimal; avoid unnecessary edits there.

## React And Next.js Conventions

- Add `"use client";` only when a file truly needs client-side hooks or browser APIs.
- All hook files in `hooks/` require `"use client";` - don't forget this directive.
- Prefer server-compatible modules by default.
- Route files may use default exports; elsewhere prefer named exports.
- Keep page components thin and move repeated logic into shared components or hooks.
- Current entity pages intentionally still use query params like `/song?id=...`.
- Do not migrate to dynamic route segments unless explicitly requested.
- Wrap top-level client components with `ErrorBoundary` from `@/components/common/error-boundary`.

## State Management

- The public Zustand interface lives in `hooks/use-store.ts`.
- Store implementation is split under `lib/store/` with slices in `lib/store/slices/`.
- When changing store behavior, preserve the public API unless there is a clear reason to change it.
- Prefer adding behavior inside the appropriate slice:
  - playback / queue
  - library history / favorites
  - playlists
  - downloads / UI
- Keep persisted state compatible with `PersistedAppStoreState` unless intentionally changing storage shape.
- Slice functions use `set as never` type assertion - this is intentional for TypeScript compatibility.
- Return values from store hooks should be memoized with `useMemo` to prevent unnecessary re-renders.

## React Query Conventions

- API functions live in `lib/api/` and return domain data, not wrapped envelopes.
- Reusable query option builders live in `lib/queries/music.ts`.
- UI-facing hooks live in `hooks/data/`.
- Prefer `queryOptions(...)` builders for new fetch patterns instead of ad hoc `useQuery` duplication.
- Use route-level shells and loading components instead of repeating pending/error UI branches.

## Types

- `tsconfig.json` is strict and includes `noUncheckedIndexedAccess`.
- Avoid `any`; prefer `unknown` and narrow explicitly.
- Prefer explicit return types on exported functions when the intent is non-trivial.
- Keep shared entity and API types in `types/`.
- Use `interface` for object-shaped props and exported contracts when it reads clearly.
- Use discriminated unions or literal unions for finite modes like repeat/status values.

## Naming Conventions

- Components: `PascalCase`
- Hooks: `useSomething`
- Utility functions: `camelCase`
- Types / interfaces: `PascalCase`
- Props interfaces: `SomethingProps`
- Constants: `UPPER_SNAKE_CASE` only for true constants; otherwise use descriptive `camelCase` locals.
- Use clear domain names like `artist`, `playlist`, `downloadedSongIds` instead of vague abbreviations.

## Error Handling

- Throw errors for programmer/config/validation failures that should stop execution.
- Catch errors around I/O, fetches, storage, and browser APIs.
- In catches, log with `logError("Context", error)` from `lib/utils/logger`.
- Show user-facing feedback with `sonner` toasts when a user action fails.
- Use `ErrorBoundary` for UI fallbacks, not as a replacement for local error handling.
- Include a short, stable context string in logs, e.g. `"Providers:syncDownloads"`.

## Config And Environment

- Public runtime config lives in `lib/config/public.ts`.
- Server-only config lives in `lib/config/server.ts`.
- Validate new environment variables with `zod` there instead of reading `process.env` all over the app.
- Do not reintroduce silent config fallbacks in feature code.
- Build info generation now lives in `scripts/build-info.mjs` and `scripts/generate-build-info.mjs`.
- Do not add side effects back into `next.config.ts`.

## Styling And UI

- Styling is Tailwind-first.
- Preserve the existing visual language unless the task explicitly asks for redesign.
- Prefer composition over adding one-off variant props everywhere.
- Accessibility rules in Biome are enabled and should be respected.
- Avoid array index keys except for static skeleton placeholders, and annotate the Biome ignore when necessary.

## Editing Guidance For Agents

- Read surrounding code before changing patterns.
- Do not introduce backward-compatibility layers unless asked.
- Do not add new dependencies unless they clearly replace custom complexity.
- If you touch package dependencies, update `package.json` and the lockfile together.
- If a file becomes large or mixes concerns, split it instead of adding more helpers into the same file.
- Keep comments sparse and useful; explain why, not the obvious what.

## Final Check Before Hand-off

- Ensure imports are clean.
- Ensure Biome passes.
- Ensure `npm run build` passes for non-trivial changes.
- Run `npm run test` if tests exist.
- Mention clearly if verification was limited.
