import { useAuth } from "../auth/AuthContext";

interface Props {
  subreddit: string;
  onChange: (name: string) => void;
}

const Header = ({ subreddit, onChange }: Props) => {
  const { user, logout, openLogin } = useAuth();

  return (
    <header className="border-b border-border/80 bg-panel/60 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-panel/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity group"
          onClick={() => onChange("technology")}
        >
          <div className="relative w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/40 border border-accent/70 overflow-hidden text-white font-black text-lg">
            <img
              src="/redsktop.png"
              alt="Redsktop"
              className="w-full h-full object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.35)]"
            />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-semibold text-base text-white">Redsktop</span>
            <span className="text-[11px] text-secondary">Minimal, fast, yours.</span>
          </div>
        </div>

        {/* Search / Navigation */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-secondary text-sm group-focus-within:text-accent transition-colors">r/</span>
            </div>
            <input
              aria-label="Subreddit"
              defaultValue={subreddit}
              onKeyDown={(e) => {
                if (e.key === "Enter") onChange((e.currentTarget as HTMLInputElement).value.trim());
              }}
              className="w-full pl-8 pr-4 py-2 bg-surface/70 border border-border/80 rounded-full text-sm text-neon placeholder-secondary/50 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all shadow-lg shadow-black/20"
              placeholder="Jump to a community..."
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3 text-sm">
          <button
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 text-secondary hover:text-neon hover:border-accent/60 transition-colors"
            onClick={() => onChange("popular")}
          >
            Explore
            <span className="h-1.5 w-1.5 rounded-full bg-accent/70" aria-hidden />
          </button>

          {user ? (
            <>
              <div className="flex items-center gap-2 text-neon bg-surface/70 py-1 px-2 rounded-full border border-border/70 shadow-sm shadow-black/20">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full bg-border" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline font-medium pr-1">{user.displayName || user.username}</span>
              </div>
              <button className="text-secondary hover:text-neon transition-colors font-medium" onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="btn btn-primary py-1.5 px-4 rounded-full shadow-lg shadow-accent/30" onClick={openLogin}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
