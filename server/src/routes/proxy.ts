import express, { Request, Response } from "express";
import { fetchWithRetry } from "../lib/fetcher.js";
import { cacheGet, cacheSet } from "../lib/redis.js";
import { sanitizeJson } from "../lib/sanitize.js";
import { config } from "../config.js";

const router = express.Router();

const respond = async (
  res: Response,
  key: string,
  ttl: number,
  fetcher: () => Promise<unknown>
) => {
  const cached = await cacheGet<unknown>(key);
  if (cached) {
    res.setHeader("x-cache-status", "HIT");
    res.json(cached);
    return;
  }

  try {
    const upstream = await fetcher();
    const sanitized = sanitizeJson(upstream);
    await cacheSet(key, sanitized, ttl);
    res.setHeader("x-cache-status", "MISS");
    res.json(sanitized);
  } catch (err) {
    console.error("Upstream error", err);
    res.status(502).json({ error: "Upstream service unavailable" });
  }
};

router.get("/r/:subreddit", async (req: Request, res: Response) => {
  const { subreddit } = req.params;
  const key = `subreddit:${subreddit}`;
  const url = `${config.upstreamBase}/r/${encodeURIComponent(subreddit)}.json`;
  await respond(res, key, config.cacheTtlPosts, () => fetchWithRetry({ url }));
});

router.get("/post/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const key = `post:${id}`;
  const url = `${config.upstreamBase}/comments/${encodeURIComponent(id)}.json`;
  await respond(res, key, config.cacheTtlComments, () => fetchWithRetry({ url }));
});

router.get("/search", async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim();
  if (!q) {
    res.status(400).json({ error: "Missing query" });
    return;
  }
  const key = `search:${q}`;
  const url = `${config.upstreamBase}/search.json?q=${encodeURIComponent(q)}`;
  await respond(res, key, config.cacheTtlPosts, () => fetchWithRetry({ url }));
});

export default router;
