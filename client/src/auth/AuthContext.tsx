import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchCurrentUser, redditAuthStart, redditAuthPoll } from "../api";

type User = { username: string; displayName?: string; avatar?: string };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  modalOpen: boolean;
  loginWithReddit: () => Promise<boolean>;
  logout: () => void;
  ensureAuth: () => boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "redsktop.auth.token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const me = await fetchCurrentUser(token);
        setUser(me);
      } catch (err) {
        console.error(err);
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  const loginWithReddit = async () => {
    if (typeof window === "undefined") return false;
    try {
      setLoading(true);
      setError(null);

      const { url, state } = await redditAuthStart();

      // Open in system browser (works better for Electron)
      window.open(url, "_blank");

      // Poll for completion since window.opener won't work from external browser
      return await new Promise<boolean>((resolve) => {
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes timeout

        const pollTimer = window.setInterval(async () => {
          attempts++;
          try {
            const result = await redditAuthPoll(state);
            if (result.status === "complete" && result.token && result.user) {
              window.clearInterval(pollTimer);
              setToken(result.token);
              setUser(result.user as User);
              localStorage.setItem(STORAGE_KEY, result.token);
              setModalOpen(false);
              setLoading(false);
              resolve(true);
            } else if (attempts >= maxAttempts) {
              window.clearInterval(pollTimer);
              setError("Sign-in timed out. Please try again.");
              setLoading(false);
              resolve(false);
            }
          } catch (err) {
            // Network error during poll, keep trying
            if (attempts >= maxAttempts) {
              window.clearInterval(pollTimer);
              setError("Sign-in timed out. Please try again.");
              setLoading(false);
              resolve(false);
            }
          }
        }, 1000);

        // Also listen for postMessage in case popup works (web browser scenario)
        const handler = (event: MessageEvent) => {
          try {
            const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            if (!data || data.source !== "redsktop-reddit-auth") return;
            window.clearInterval(pollTimer);
            window.removeEventListener("message", handler);
            if (data.token) {
              setToken(data.token);
              setUser(data.user as User);
              localStorage.setItem(STORAGE_KEY, data.token);
              setModalOpen(false);
              setLoading(false);
              resolve(true);
            } else {
              setError("Reddit login failed");
              setLoading(false);
              resolve(false);
            }
          } catch (err) {
            console.error(err);
          }
        };
        window.addEventListener("message", handler);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reddit login failed";
      setError(message);
      setLoading(false);
      return false;
    }
  };

  const ensureAuth = () => {
    if (token) return true;
    setModalOpen(true);
    return false;
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    error,
    modalOpen,
    loginWithReddit,
    logout,
    ensureAuth,
    openLogin: () => setModalOpen(true),
    closeLogin: () => setModalOpen(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
