# Redsktop

Redsktop is an independent desktop client that proxies Reddit JSON endpoints, sanitizes each response, caches data in-memory, and ships a React + Vite UI wrapped in Electron. The project is unaffiliated with Reddit and focuses on delivering a lightweight, opinionated reader with built-in rate limiting.

<p align="center">
   <img src="./image.png" alt="Redsktop preview" width="900" />
</p>

## Requirements

- Node.js (v18+) and npm
- Git
- Optional: Docker for environment parity when using `infra/`

## Environment

1. Copy `.env` from the root and fill in the Reddit OAuth credentials and ports:

   - `PORT=8910`
   - `PUBLIC_BASE_URL=http://localhost:8910`
   - `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
   - `REDDIT_REDIRECT_URI=http://localhost:8910/auth/reddit/callback`
   - `REDDIT_SCOPES=identity read vote submit history save subscribe mysubreddits`

2. Install dependencies and run each service in parallel if desired:

   - `cd server && npm install && npm run dev`
   - `cd client && npm install && npm run dev` (UI served from `http://localhost:5173`)
   - Build the client before starting Electron: `cd client && npm run build` followed by `cd electron && npm install && npm run start`

3. Verify the server: `GET http://localhost:8910/health`

## API surface

- `GET /api/r/:subreddit` → subreddit listing
- `GET /api/post/:id` → post with comments
- `GET /api/search?q=...` → search results

Every response is sanitized, cached, and annotated with `x-cache-status` plus rate-limit headers.

## Testing

- `cd server && npm test`

## Deployment helpers

The `deployment/` helpers orchestrate installs, tests, and builds for all three packages. They also optionally launch the server and client preview (pass `--serve` on Unix or `-Serve` on Windows).

- Linux/macOS: `bash deployment/linux.sh` or `bash deployment/macos.sh`
- macOS script mirrors the Linux flow with mac-native shebang handling.
- Windows: `powershell -ExecutionPolicy Bypass -File deployment/windows.ps1` (add `-Serve` to keep the server and client running after the builds finish)

Each helper installs dependencies, runs the server tests, builds the Node projects, and compiles the Electron shell. Use them when preparing release artifacts or running full-stack checks locally.

## Project structure

- `server/` – Express proxy and OAuth handling (TypeScript)
- `client/` – React + Vite + Tailwind frontend
- `electron/` – Electron shell bundling the built client
- `infra/` – Docker Compose helpers for staging/local infrastructure
- `deployment/` – Platform-aware scripts for dependency installation, tests, and builds

## License

MIT License. See `LICENSE`.
