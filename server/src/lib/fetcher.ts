import { config } from "../config.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FetcherOptions {
  url: string;
  maxRetries?: number;
}

export const fetchWithRetry = async <T>({ url, maxRetries = 3 }: FetcherOptions): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const headers: Record<string, string> = {
        "User-Agent": config.upstreamUserAgent,
        Accept: "application/json",
      };

      const res = await fetch(url, {
        headers,
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after")) || 1;
        await wait(retryAfter * 1000);
        attempt += 1;
        continue;
      }

      if (!res.ok) {
        throw new Error(`Upstream responded ${res.status}`);
      }

      const data = (await res.json()) as T;
      return data;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      await wait(2 ** attempt * 200);
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Upstream fetch failed");
};
