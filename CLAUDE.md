# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Each folder has its own CLAUDE.md or AGENTS.md with commands and architecture; read it before working there.

- `apps/` — Expo / React Native mobile app (bun). **Android only** (`apps/RULES.md`). See `apps/CLAUDE.md` and `apps/AGENTS.md`.
- `server/` — Django 6 + DRF API (uv, Python 3.14, Postgres, RustFS/S3). See `server/CLAUDE.md`.
- `web/` — Next.js 16 site (bun), still the `create-next-app` scaffold. See `web/AGENTS.md`; this version has breaking changes.

## API response contract (enforced — do not bypass)

This is the one rule that spans the server and the mobile app. Every DRF response uses one of two envelopes. Clients branch on `status` and key on `error.code` (stable), never on `error.message` (display text).

```jsonc
// success (any status < 400, except 204 which stays empty; null data becomes {})
{ "status": "ok", "data": { } }

// error
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",   // UPPER_SNAKE_CASE
    "message": "Validation failed.",
    "details": [                   // always a list; [] when there is nothing to itemize
      { "field": "items.1.qty", "message": "A valid integer is required.", "code": "INVALID" }
    ]
  }
}
```

- `details[].field` is a dotted path (`items.1.qty`), or `null` for non-field errors.
- Changing the shape means changing both ends together: `server/config/error.py` (+ the renderer and handler) and `apps/src/types/error.type.ts` (+ `apps/src/api/`).
- How the server enforces it and how to write endpoints: `server/CLAUDE.md`. How the app consumes it: `apps/CLAUDE.md`.
