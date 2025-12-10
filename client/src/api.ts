const resolveBase = () => {
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return "http://localhost:4000";
  }
  return import.meta.env.VITE_API_BASE || "";
};

const API_BASE = resolveBase();

export const apiUrl = (path: string) => `${API_BASE}${path}`;

const readError = async (res: Response) => {
  try {
    const data = await res.json();
    if (data?.error) return data.error;
  } catch (err) {
    // ignore
  }
  return `Request failed with ${res.status}`;
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const message = await readError(res);
    throw new Error(message);
  }
  return (await res.json()) as T;
};

export const loginRequest = (username: string, password: string) =>
  apiFetch<{ token: string; user: { username: string } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const fetchCurrentUser = (token: string) =>
  apiFetch<{ user: { username: string; displayName?: string; avatar?: string } }>("/api/auth/me", {}, token).then((r) => r.user);

export const postAction = (action: "vote" | "save", payload: Record<string, unknown>, token: string) =>
  apiFetch<{ status: string }>(`/api/actions/${action}`, { method: "POST", body: JSON.stringify(payload) }, token);

export const redditAuthStart = () => apiFetch<{ url: string; state: string }>("/api/auth/reddit/login");

export const redditAuthPoll = (state: string) =>
  apiFetch<{ status: "pending" | "complete"; token?: string; user?: { username: string; displayName?: string; avatar?: string } }>(`/api/auth/reddit/poll/${state}`);
