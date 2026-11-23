# songs

A minimal music stack on top of JioSaavn's unofficial API: a Hono API, a Next.js web app and **Modes**, an iOS app with
one hidden on-device listener profile behind For You.

```
apps/api    Hono service that wraps JioSaavn (deployed on Vercel, region bom1)
apps/web    Next.js 16 web client, talks to the API through Hono RPC types
apps/ios    Modes: SwiftUI + ModesCore (pure Swift package), XcodeGen
research/   Offline recommender experiments (Python), not shipped
tools/dev   Scripts for the iOS dev loop and the combined check
```

## Develop

```sh
pnpm install
pnpm dev:api          # API on localhost
pnpm dev:web          # web on localhost:3000
pnpm check            # everything: swift test, lint, typecheck, tests, device build
```

iOS: `cd apps/ios && xcodegen generate`, then `tools/dev/ios-run.sh --capture --debug-log`. See `apps/ios/README.md`.

Licensed MIT. The API derives from [sumitkolhe/jiosaavn-api](https://github.com/sumitkolhe/jiosaavn-api); see `LICENSE`.
