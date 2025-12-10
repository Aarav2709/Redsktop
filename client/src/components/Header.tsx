import { useAuth } from "../auth/AuthContext";

interface Props {
  subreddit: string;
  onChange: (name: string) => void;
}

const Header = ({ subreddit, onChange }: Props) => {
  const { user, logout, openLogin } = useAuth();

  return (
    <header className="border-b border-border bg-panel sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onChange("technology")}
        >
          <span className="font-bold text-lg text-accent">Redsktop</span>
        </div>

        {/* Search / Navigation */}
        <div className="flex-1 max-w-md">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <span className="text-secondary text-sm">r/</span>
             </div>
             <input
              aria-label="Subreddit"
              defaultValue={subreddit}
              onKeyDown={(e) => {
                if (e.key === "Enter") onChange((e.currentTarget as HTMLInputElement).value);
              }}
              className="w-full pl-7 pr-3 py-1.5 bg-base border border-border rounded text-sm text-neon placeholder-secondary focus:border-accent focus:outline-none transition-colors"
              placeholder="subreddit..."
            />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-neon">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded bg-border" />
                ) : (
                  <div className="w-6 h-6 rounded bg-border flex items-center justify-center text-xs">{user.username.charAt(0).toUpperCase()}</div>
                )}
                <span className="hidden sm:inline">{user.displayName || user.username}</span>
              </div>
              <button className="text-secondary hover:text-accent transition-colors" onClick={logout}>Log out</button>
            </>
          ) : (
            <button className="text-neon hover:text-accent transition-colors font-medium" onClick={openLogin}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
