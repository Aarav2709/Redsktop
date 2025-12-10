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
      className="card hover:border-secondary/50 transition-colors cursor-pointer p-3 sm:p-4"
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-4">
        {hasThumb && (
          <div className="flex-shrink-0">
            <img
              src={post.thumbnail}
              alt="thumb"
              className="w-20 h-20 object-cover rounded bg-base border border-border"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-medium text-neon leading-snug mb-1.5">
            {post.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-secondary mb-3">
            <span className="font-bold hover:text-neon">r/subreddit</span>
            <span>•</span>
            <span>u/{post.author}</span>
            {status && <span className="text-accent">• {status}</span>}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-secondary">
            <div className="flex items-center gap-1 bg-base/50 rounded px-1.5 py-0.5 border border-border/50">
              <button
                className={`hover:text-accent p-1 transition-colors ${vote === "up" ? "text-accent" : ""}`}
                onClick={(e) => handleVote("up", e)}
                aria-label="Upvote"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <span className={`min-w-[2ch] text-center ${vote ? "text-accent" : ""}`}>
                {score > 1000 ? (score / 1000).toFixed(1) + 'k' : score}
              </span>
              <button
                className={`hover:text-blue-500 p-1 transition-colors ${vote === "down" ? "text-blue-500" : ""}`}
                onClick={(e) => handleVote("down", e)}
                aria-label="Downvote"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <button
              className="flex items-center gap-1.5 hover:bg-base/50 px-2 py-1 rounded transition-colors hover:text-neon"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Comments</span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:bg-base/50 px-2 py-1 rounded transition-colors hidden sm:flex hover:text-neon"
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
              className="flex items-center gap-1.5 hover:bg-base/50 px-2 py-1 rounded transition-colors hidden sm:flex hover:text-neon"
              onClick={handleSave}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
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
