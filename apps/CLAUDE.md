# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Expo / React Native app, **Android only** (`RULES.md`). Read `AGENTS.md` before touching any Expo or React Native API; it holds the Expo-specific rules, so they are not repeated here.

## Commands

Run from `apps/`:

```bash
bun install
bun run android          # needs an emulator/device
bun run lint             # expo lint
bunx tsc --noEmit        # typecheck (run lint + typecheck before calling a task done)
bun run test             # vitest, once (`bun run test:watch` to watch)
bunx expo install <pkg>  # always use this to add deps, never `bun add`
```

Tests live in `tests/` (mirrors `src/`, files named `*.test.ts`) and run in a plain Node environment, so they cover pure logic only: keep it in modules that don't import `react-native` (e.g. `src/lib/`, `src/feature/Maps/avatar-scale.ts`). `@` resolves to `src/` (`vitest.config.mts`).

The backend URL comes from `EXPO_PUBLIC_API_URL` (committed default in `.env`, override in the gitignored `.env.local`). Expo inlines it at build time, so it must be read as the static `process.env.EXPO_PUBLIC_API_URL`. For an emulator or USB device, run `adb reverse tcp:8000 tcp:8000` so `localhost:8000` reaches the host.

## API client

The envelope shape is defined in the root `CLAUDE.md`. Route every server call through `api` in `src/api/api.ts`, never bare `fetch`:

- `api.get/post/put/patch/delete<T>()` resolve with the unwrapped `data` (`undefined` for 204) and throw `ApiError` for everything else.
- `ApiError` (`src/api/error.ts`) carries `code`, `message`, `details` and `httpStatus`. Branch on `code`, and map `details[].field` onto form fields.
- `NETWORK_ERROR` (`httpStatus` 0, request never reached the server) is the only code synthesized client-side. The client trusts the body to be an envelope and does not validate it.
- A request cancelled through its `signal` rethrows the original abort error, not an `ApiError`.
- Paths need Django's trailing slash (`/api/auth/login/`). Paths live in `src/lib/api-routes.ts`. Auth headers are passed per call via `headers`; the client does not inject the access token itself.
- **401 handling.** A 401 from any non-auth path triggers one refresh (`POST /api/auth/token/refresh/` with the refresh token from `expo-secure-store`), saves the rotated `{access, refresh}` pair, and retries the request once with `Authorization: Bearer <new access>`. Concurrent 401s share one refresh, because a rotated refresh token is single-use. If the refresh fails (or no refresh token is stored) it only `console.log`s for now and rethrows the original 401 `ApiError`. Login, register, logout and refresh are never refreshed on 401, so their errors stay real answers. Secure-store keys are in `src/lib/secure-store.ts`.
- Envelope types are in `src/types/error.type.ts`.

## Colors

`src/style/brand.css` is the one place colors are defined (shadcn tokens, `:root` and `.dark:root`); `tailwind.config.js` exposes each as a class. `scripts/build-palette.js` turns it into `src/style/palette.generated.ts` (Metro regenerates it on start, or `bun run build:palette`), which feeds everything that can't read CSS variables: the navigation theme (`src/lib/theme.ts`) and the map theme. Never hand-copy a color into JS. To add a color: add `--name` to both CSS blocks, add it to `tailwind.config.js` (a test fails if the two disagree or the generated file is stale), then use it in `MAP_COLORS` (`src/feature/Maps/map-theme.ts`) if the map should show it. `MAP_COLORS` is the table of which NativeWind color each Mapbox Standard color setting takes. The map follows the app's color scheme.

## Architecture

- Expo Router: routes live only in `src/app/`, grouped as `(auth)` and `(main)`; anything that is not a screen goes elsewhere. Path alias `@/*` maps to `src/*`.
- `src/feature/<Name>/` holds feature code, `src/components/ui/` is the shadcn-style primitive set (`@rn-primitives/*` + NativeWind), `src/components/feedback/` holds loading/error/success/not-found states.
- `src/context/Providers.tsx` wires the theme and TanStack Query (`src/clients/query-client.ts`: queries retry twice, mutations never retry). Client state is Zustand in `src/context/stores/`.
