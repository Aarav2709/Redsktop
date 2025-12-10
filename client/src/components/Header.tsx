import { useAuth } from "../auth/AuthContext";

interface Props {
  subreddit: string;
  onChange: (name: string) => void;
}

const Header = ({ subreddit, onChange }: Props) => {
  const { user, logout, openLogin } = useAuth();

  return (
    <header className="border-b border-border bg-panel/80 backdrop-blur-md sticky top-0 z-50 supports-[backdrop-filter]:bg-panel/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
          onClick={() => onChange("technology")}
        >
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
            R
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">Redsktop</span>
        </div>

        {/* Search / Navigation */}
        <div className="flex-1 max-w-md">
          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <span className="text-secondary text-sm group-focus-within:text-accent transition-colors">r/</span>
             </div>
             <input
              aria-label="Subreddit"
              defaultValue={subreddit}
              onKeyDown={(e) => {
                if (e.key === "Enter") onChange((e.currentTarget as HTMLInputElement).value);
              }}
              className="w-full pl-8 pr-4 py-2 bg-surface border border-border rounded-full text-sm text-neon placeholder-secondary/50 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all shadow-sm"
              placeholder="Find a community..."
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-neon bg-surface py-1 px-2 rounded-full border border-border">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded-full bg-border" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-xs">{user.username.charAt(0).toUpperCase()}</div>
                )}
                <span className="hidden sm:inline font-medium pr-1">{user.displayName || user.username}</span>
              </div>
              <button className="text-secondary hover:text-neon transition-colors font-medium" onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="btn btn-primary py-1.5 px-4 rounded-full" onClick={openLogin}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
