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
    30
  ),
  cacheTtlComments: ttlFromEnv(
    process.env.CACHE_TTL_COMMENTS,
    process.env.REDIS_TTL_COMMENTS,
    300
  ),
  upstreamUserAgent:
    process.env.UPSTREAM_USER_AGENT ||
    "RedsktopProxy/0.1 (+https://example.com; not affiliated)",
  upstreamBase: "https://www.reddit.com",
  oauthToken: process.env.REDDIT_OAUTH_TOKEN,
  authUser: process.env.AUTH_USER || "demo",
  authPass: process.env.AUTH_PASS || "demo",
  authSecret: process.env.AUTH_SECRET || "change-me",
  // Reddit OAuth
  redditClientId: process.env.REDDIT_CLIENT_ID,
  redditClientSecret: process.env.REDDIT_CLIENT_SECRET,
  redditRedirectUri: process.env.REDDIT_REDIRECT_URI || "http://localhost:8910/auth/reddit/callback",
  redditScopes:
    process.env.REDDIT_SCOPES ||
    "identity read vote submit history save subscribe mysubreddits",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:4000",
};
