# Redsktop

Independent desktop client that proxies public Reddit JSON endpoints, sanitizes responses, caches responses in-memory, enforces rate limits, and ships a bundled React + Electron UI. Not affiliated with Reddit.

## Quick start

1. Copy `.env` and set:

   - `PORT=8910`
   - `PUBLIC_BASE_URL=http://localhost:8910`
   - `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`
   - `REDDIT_REDIRECT_URI=http://localhost:8910/auth/reddit/callback`
   - `REDDIT_SCOPES=identity read vote submit history save subscribe mysubreddits`

2. Install and run:

   - Server: `cd server && npm install && npm run dev`
   - Client (Vite): `cd client && npm install && npm run dev` (UI at `http://localhost:5173`)
   - Electron: build client first (`cd client && npm run build`), then `cd electron && npm install && npm run start`

3. Health check: `GET http://localhost:8910/health`

## OAuth (Reddit)

- Start login from the app; it opens Reddit consent in the system browser and returns via `http://localhost:8910/auth/reddit/callback`.
- Tokens are stored per user in `server/data/reddit_tokens.json` (not committed by default). Keep secrets out of source control.

## API

- `GET /api/r/:subreddit` → subreddit listing
- `GET /api/post/:id` → post + comments
- `GET /api/search?q=...` → search results

Responses are sanitized and cached. Headers include `x-cache-status` and rate-limit headers.

## Building Electron release

- Build client: `cd client && npm run build`
- Package Electron: `cd electron && npm install && npm run build` (artifacts in `electron/release`)

## Testing

- `cd server && npm test`

## Project structure

- `server/` – Express proxy and OAuth handling (TypeScript)
- `client/` – React + Vite + Tailwind frontend
- `electron/` – Electron shell bundling the built client
- `infra/` – Docker Compose helpers

## License

MIT License. See `LICENSE`.
