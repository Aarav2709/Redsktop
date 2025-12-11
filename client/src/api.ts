const upstream = "https://www.reddit.com";

const resolveProxyBase = () => {
  const configured = import.meta.env.VITE_API_BASE || "";
  if (configured) return configured;
  // When packaged (file://), fall back to direct Reddit JSON so the app works without a local server.
  return "";
};

const PROXY_BASE = resolveProxyBase();
const USE_PROXY = Boolean(PROXY_BASE);

const readError = async (res: Response) => {
  try {
    const data = await res.json();
    if (data?.error) return data.error;
  } catch (err) {
    // ignore
  }
  return `Request failed with ${res.status}`;
};

export const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const needsJsonHeader = Boolean(options.body);
  const headers: Record<string, string> = {
    ...(needsJsonHeader ? { "content-type": "application/json" } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const message = await readError(res);
    throw new Error(message);
  }
  return (await res.json()) as T;
};

export const fetchSubredditListing = (subreddit: string, after = "") => {
  const qp = after ? `?after=${encodeURIComponent(after)}` : "";
  const url = USE_PROXY
    ? `${PROXY_BASE}/api/r/${encodeURIComponent(subreddit)}${qp}`
    : `${upstream}/r/${encodeURIComponent(subreddit)}.json${qp}`;
  return apiFetch<{ data: { children: Array<{ data: any }>; after?: string } }>(url);
};

export const fetchSortedFrontpage = (sort: string, after = "") => {
  const qp = after ? `?after=${encodeURIComponent(after)}` : "";
  const url = USE_PROXY
    ? `${PROXY_BASE}/api/sort/${encodeURIComponent(sort)}${qp}`
    : `${upstream}/${encodeURIComponent(sort)}.json${qp}`;
  return apiFetch<{ data: { children: Array<{ data: any }>; after?: string } }>(url);
};

export const fetchPostWithComments = (id: string) => {
  const url = USE_PROXY
    ? `${PROXY_BASE}/api/post/${id}`
    : `${upstream}/comments/${encodeURIComponent(id)}.json`;
  return apiFetch<[{ data: { children: Array<{ data: any }> } }, { data: { children: Array<{ data: any }> } }]>(url);
};
