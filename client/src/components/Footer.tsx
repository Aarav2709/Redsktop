const Footer = () => {
  return (
    <footer className="py-8 text-center text-xs text-secondary opacity-70 hover:opacity-100 transition-opacity border-t border-border/70 mt-8">
      <div className="flex flex-col items-center gap-2">
        <p>Independent client. Not affiliated with Reddit.</p>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="pill bg-surface/70">Fast feed</span>
          <span className="pill bg-surface/70">Privacy forward</span>
          <span className="pill bg-surface/70">Made for desktop</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
