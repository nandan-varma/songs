# @songs/api

A small [Hono](https://hono.dev) service that wraps JioSaavn's private `api.php` and returns clean JSON.
Every response is `{ success: true, data }`, or `{ success: false, message }` with an error status.
Lists are 0-indexed. HTML entities are decoded, song media URLs are decrypted, and a malformed song in
a batch is skipped instead of failing the request.

## Endpoints

All routes are `GET` under `/api`.

| Route                                                                     | Query                                                                              | Returns                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| `/songs`                                                                  | `ids` (comma separated) or `link`                                                  | songs                                               |
| `/songs/:id`                                                              |                                                                                    | `[song]`                                            |
| `/songs/:id/suggestions`                                                  | `limit` (10)                                                                       | songs                                               |
| `/songs/:id/lyrics`                                                       |                                                                                    | `{ lyrics, snippet, copyright }`                    |
| `/albums`                                                                 | `id` or `link`                                                                     | album with songs                                    |
| `/artists`, `/artists/:id`                                                | `id` or `link`, `songCount` (10), `albumCount` (10), `page`, `sortBy`, `sortOrder` | artist                                              |
| `/artists/:id/songs`                                                      | `page`, `sortBy`, `sortOrder`                                                      | `{ total, songs }`                                  |
| `/artists/:id/albums`                                                     | `page`, `sortBy`, `sortOrder`                                                      | `{ total, albums }`                                 |
| `/playlists`                                                              | `id` or `link`, `page`, `limit` (10)                                               | playlist with one page of songs                     |
| `/search/songs`, `/search/albums`, `/search/artists`, `/search/playlists` | `query`, `page`, `limit` (10)                                                      | `{ total, start, results }`                         |
| `/trending`                                                               | `type` (`song`, `album`, `playlist`), `language`                                   | list                                                |
| `/charts`                                                                 |                                                                                    | chart playlists (fetch songs with `/playlists?id=`) |

`sortBy` is `popularity`, `latest` or `alphabetical`; `sortOrder` is `asc` or `desc`. A `link` is a
`jiosaavn.com` URL for that kind of entity.

## Types

`import type { AppType } from "@songs/api"` gives Hono's RPC client the full route and response types:
`hc<AppType>(origin).api.songs[":id"].$get(...)`. The package exports TypeScript source; there is no build.

## Development

```sh
pnpm --filter @songs/api dev        # http://localhost:3001/api, restarts on change (PORT to change)
pnpm --filter @songs/api typecheck
pnpm --filter @songs/api test       # offline: upstream fetch is mocked with recorded fixtures
```

Fixtures in `test/fixtures` are trimmed real `api.php` responses.

## Deploy

Vercel's zero-config Hono support serves the default export of `src/index.ts`; there is no adapter. `vercel.json`
only pins the region to `bom1` because JioSaavn geo-restricts. CORS (`GET`, `OPTIONS`, any origin) and
`Cache-Control: s-maxage=300, stale-while-revalidate` on successful responses are set in code.

Media URLs use a DES key JioSaavn publishes in its own web app. Node's OpenSSL 3 no longer ships DES outside
its legacy provider, so `src/lib/des.ts` is a small decrypt-only implementation instead of a dependency.
