import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { postAction } from "../api";
import { Post } from "../pages/SubredditView";

interface Props {
  post: Post;
  onOpen: () => void;
}

const PostCard = ({ post, onOpen }: Props) => {
  const { token, ensureAuth } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [score, setScore] = useState(post.score);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const hasThumb = post.thumbnail && post.thumbnail.startsWith("http");

  const handleVote = async (direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth() || !token) return;
    if (vote === direction) return;

    const prevVote = vote;
    const prevScore = score;
    const delta = (direction === "up" ? 1 : -1) + (prevVote === "up" ? -1 : prevVote === "down" ? 1 : 0);

    setVote(direction);
    setScore((s) => s + delta);

    try {
      await postAction("vote", { id: post.id, direction }, token);
      setStatus(direction === "up" ? "Upvoted" : "Downvoted");
    } catch (err) {
      setVote(prevVote);
      setScore(prevScore);
      setStatus("Vote failed");
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ensureAuth() || !token) return;
    await postAction("save", { id: post.id }, token);
    setStatus("Saved");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
      setStatus("Shared");
      return;
    }
    await navigator.clipboard.writeText(url);
    setStatus("Link copied");
  };

  return (
    <article
      className="card relative cursor-pointer p-4 group bg-gradient-to-br from-panel/90 via-panel/80 to-surface/70 border border-border/80 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-300"
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" aria-hidden />
      <div className="flex gap-4 relative">
        {/* Vote Column (Desktop) */}
        <div className="hidden sm:flex flex-col items-center gap-1 pt-1 bg-surface/60 rounded-xl px-2 py-2 border border-border/70 shadow-inner shadow-black/30">
           <button
              className={`p-1 rounded hover:bg-surface hover:text-accent transition-colors ${vote === "up" ? "text-accent" : "text-secondary"}`}
              onClick={(e) => handleVote("up", e)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <span className={`text-xs font-bold ${vote ? "text-accent" : "text-neon"}`}>
              {score > 1000 ? (score / 1000).toFixed(1) + 'k' : score}
            </span>
            <button
              className={`p-1 rounded hover:bg-surface hover:text-indigo-400 transition-colors ${vote === "down" ? "text-indigo-400" : "text-secondary"}`}
              onClick={(e) => handleVote("down", e)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
        </div>

        {hasThumb && (
          <div className="flex-shrink-0 pt-1">
            <img
              src={post.thumbnail}
              alt="thumb"
              className="w-24 h-24 object-cover rounded-xl bg-surface border border-border group-hover:border-accent/40 transition-colors shadow-md shadow-black/30"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-secondary">
            <span className="pill bg-accent/10 border-accent/30 text-accent">r/{post.subreddit || "subreddit"}</span>
            <span className="pill bg-surface/60 border-border/70 text-secondary">u/{post.author}</span>
            {status && <span className="pill bg-surface/70 border-accent/40 text-accent">{status}</span>}
          </div>

          <h3 className="text-lg font-semibold text-neon leading-snug group-hover:text-white transition-colors line-clamp-3">
            {post.title}
          </h3>

          <div className="flex items-center gap-3 text-xs font-medium text-secondary flex-wrap">
            {/* Mobile Vote (Horizontal) */}
            <div className="flex sm:hidden items-center gap-1 bg-surface/70 rounded-full px-2 py-1 border border-border/70 shadow-inner shadow-black/20">
              <button
                className={`hover:text-accent p-0.5 ${vote === "up" ? "text-accent" : ""}`}
                onClick={(e) => handleVote("up", e)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
              </button>
              <span className={`min-w-[2ch] text-center ${vote ? "text-accent" : ""}`}>
                {score > 1000 ? (score / 1000).toFixed(1) + 'k' : score}
              </span>
              <button
                className={`hover:text-indigo-400 p-0.5 ${vote === "down" ? "text-indigo-400" : ""}`}
                onClick={(e) => handleVote("down", e)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
            </div>

            <button
              className="flex items-center gap-1.5 hover:bg-surface/60 px-2 py-1 rounded-full transition-colors hover:text-neon border border-transparent hover:border-border/70"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Comments</span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:bg-surface/60 px-2 py-1 rounded-full transition-colors hidden sm:flex hover:text-neon border border-transparent hover:border-border/70"
              onClick={handleShare}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Share</span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:bg-surface/60 px-2 py-1 rounded-full transition-colors hidden sm:flex hover:text-neon border border-transparent hover:border-border/70"
              onClick={handleSave}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
