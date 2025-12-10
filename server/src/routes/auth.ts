import express from "express";
import crypto from "crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { signToken, verifyToken, extractToken } from "../lib/auth.js";

const redditState = new Map<string, number>();
const pendingAuth = new Map<string, { token: string; user: object; expiresAt: number }>();

const makeState = () => {
  const raw = crypto.randomBytes(12).toString("hex");
  const ttl = Date.now() + 5 * 60 * 1000;
  redditState.set(raw, ttl);
  return raw;
};

const takeState = (state: string | undefined) => {
  if (!state) return false;
  const exp = redditState.get(state);
  redditState.delete(state);
  return Boolean(exp && exp > Date.now());
};

// token persistence without DB: server/data/reddit_tokens.json
const tokenStorePath = path.join(process.cwd(), "server", "data", "reddit_tokens.json");
const ensureStore = () => {
  const dir = path.dirname(tokenStorePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(tokenStorePath)) fs.writeFileSync(tokenStorePath, "{}", "utf8");
};
const readStore = (): Record<string, any> => {
  try {
    ensureStore();
    return JSON.parse(fs.readFileSync(tokenStorePath, "utf8"));
  } catch {
    return {};
  }
};
const writeStore = (data: Record<string, any>) => {
  ensureStore();
  fs.writeFileSync(tokenStorePath, JSON.stringify(data, null, 2), "utf8");
};

// Cleanup expired pending auth entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingAuth) {
    if (val.expiresAt < now) pendingAuth.delete(key);
  }
}, 60_000);
cleanupInterval.unref(); // Don't keep process alive just for cleanup

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }

  if (username !== config.authUser || password !== config.authPass) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const user = { username };
  const token = signToken(user);
  res.json({ token, user });
});

router.get("/me", (req, res) => {
  const token = extractToken(req.header("authorization"));
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  res.json({ user: { username: session.username, displayName: session.displayName, avatar: session.avatar } });
});
// Reddit OAuth start
router.get("/reddit/login", (req, res) => {
  if (!config.redditClientId || !config.redditRedirectUri) {
    res.status(501).json({ error: "Reddit OAuth not configured" });
    return;
  }
  const state = makeState();
  const params = new URLSearchParams({
    client_id: config.redditClientId,
    response_type: "code",
    state,
    redirect_uri: config.redditRedirectUri,
    duration: "permanent",
    scope: config.redditScopes,
  });
  const url = `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  if (req.headers.accept?.includes("json")) {
    res.json({ url, state });
  } else {
    res.redirect(url);
  }
});

// Polling endpoint for Electron app to check if auth completed
router.get("/reddit/poll/:state", (req, res) => {
  const { state } = req.params;
  const result = pendingAuth.get(state);
  if (result) {
    pendingAuth.delete(state);
    res.json({ status: "complete", token: result.token, user: result.user });
  } else {
    res.json({ status: "pending" });
  }
});

router.get("/reddit/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!state || !takeState(state)) {
    res.status(400).send("Invalid state");
    return;
  }
  if (!code || !config.redditClientId || !config.redditClientSecret || !config.redditRedirectUri) {
    res.status(400).send("Missing configuration");
    return;
  }
  try {
    const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${Buffer.from(`${config.redditClientId}:${config.redditClientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redditRedirectUri,
      }),
    });
    if (!tokenRes.ok) {
      res.status(502).send("Failed to exchange code");
      return;
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string };
    if (!tokenJson.access_token) {
      res.status(502).send("No access token");
      return;
    }

    const profileRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        authorization: `Bearer ${tokenJson.access_token}`,
        "User-Agent": config.upstreamUserAgent,
      },
    });
    if (!profileRes.ok) {
      res.status(502).send("Failed to fetch profile");
      return;
    }
    const profile = (await profileRes.json()) as { name?: string; icon_img?: string; subreddit?: { title?: string } };
    if (!profile.name) {
      res.status(400).send("Profile missing name");
      return;
    }

    const user = { username: profile.name, displayName: profile.subreddit?.title ?? profile.name, avatar: profile.icon_img };
    const token = signToken(user);
    const payload = JSON.stringify({ token, user, source: "redsktop-reddit-auth" });

    // Persist tokens per user without DB
    const store = readStore();
    store[user.username] = {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      expires_at: Date.now() + (tokenJson.expires_in ?? 3600) * 1000,
      scope: tokenJson.scope,
    };
    writeStore(store);

    // Store result for polling (Electron app will poll for this)
    pendingAuth.set(state, { token, user, expiresAt: Date.now() + 5 * 60 * 1000 });

    const targetOrigin = config.publicBaseUrl || "*";
    res.setHeader(
      "content-security-policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );

    res.setHeader("content-type", "text/html");
    res.send(`<!doctype html><html><head>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f0f0f; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1a1a1a; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px; }
        h2 { color: #4ade80; margin-bottom: 1rem; }
        p { color: #888; margin-bottom: 1.5rem; }
      </style>
    </head><body><div class="card">
      <h2>✓ Signed in with Reddit</h2>
      <p>You can close this tab and return to Redsktop.</p>
    </div><script>
      try {
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(payload)}, ${JSON.stringify(targetOrigin)});
          setTimeout(() => window.close(), 500);
        }
      } catch (e) { /* ignore */ }
    </script></body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Reddit auth failed");
  }
});

router.post("/reddit/unlink", (req, res) => {
  const token = extractToken(req.header("authorization"));
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const store = readStore();
  if (store[session.username]) {
    delete store[session.username];
    writeStore(store);
  }
  res.json({ status: "unlinked" });
});

export default router;
