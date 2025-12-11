interface Props {
  subreddit: string;
  onChange: (name: string) => void;
}

const Header = ({ subreddit, onChange }: Props) => {
  return (
    <header className="border-b border-border/80 bg-panel/70 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-panel/60">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity group"
          onClick={() => onChange(subreddit)}
        >
          <div className="relative w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md shadow-accent/25 border border-accent/60 overflow-hidden text-white font-black text-lg">
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

        <div aria-hidden className="flex-1" />

        {/* Search / Navigation */}
        <div className="w-52 sm:w-64 md:w-72 lg:w-80 max-w-full">
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
              className="w-full pl-8 pr-3 py-2 bg-surface/80 border border-border/80 rounded-full text-sm text-neon placeholder-secondary/60 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all shadow-lg shadow-black/10"
              placeholder="Jump to subreddit"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
