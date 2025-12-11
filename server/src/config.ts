import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const ttlFromEnv = (
  primary: string | undefined,
  legacy: string | undefined,
  fallback: number
): number => {
  return toNumber(primary ?? legacy, fallback);
};

export const config = {
  port: toNumber(process.env.PORT, 4000),
  cacheTtlPosts: ttlFromEnv(
    process.env.CACHE_TTL_POSTS,
    process.env.REDIS_TTL_POSTS,
    60
  ),
  cacheTtlComments: ttlFromEnv(
    process.env.CACHE_TTL_COMMENTS,
    process.env.REDIS_TTL_COMMENTS,
    180
  ),
  upstreamUserAgent:
    process.env.UPSTREAM_USER_AGENT ||
    "RedsktopProxy/0.1 (+https://example.com; not affiliated)",
  upstreamBase: "https://www.reddit.com",
};
