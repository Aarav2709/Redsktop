import { createContext, useContext, ReactNode } from "react";

type AuthContextValue = {
  user: null;
  token: null;
  loading: false;
  error: null;
  modalOpen: false;
  loginWithReddit: () => Promise<boolean>;
  logout: () => void;
  ensureAuth: () => boolean;
  openLogin: () => void;
  closeLogin: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const noop = () => {};
const asyncFalse = async () => false;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const value: AuthContextValue = {
    user: null,
    token: null,
    loading: false,
    error: null,
    modalOpen: false,
    loginWithReddit: asyncFalse,
    logout: noop,
    ensureAuth: () => false,
    openLogin: noop,
    closeLogin: noop,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
