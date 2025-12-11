import { useState } from "react";
import { Post } from "../pages/SubredditView";

interface Props {
  post: Post;
  onOpen: () => void;
}

const PostCard = ({ post, onOpen }: Props) => {
  const [status, setStatus] = useState<string | null>(null);
  const hasThumb = post.thumbnail && post.thumbnail.startsWith("http");

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
      className="bg-panel/90 border border-border/70 rounded-xl cursor-pointer p-3 hover:border-accent/50 transition-colors"
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className="flex gap-3 items-start">
        {hasThumb && (
          <div className="flex-shrink-0 pt-1">
            <img
              src={post.thumbnail}
              alt="thumb"
              className="w-20 h-20 object-cover rounded-lg bg-surface border border-border/70"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-secondary">
            <span className="font-semibold text-neon">r/{post.subreddit || "subreddit"}</span>
            <span className="text-border">•</span>
            <span>u/{post.author}</span>
            <span className="text-border">•</span>
            <span>{post.score} pts</span>
            {status && <span className="text-accent text-[11px] font-medium">{status}</span>}
          </div>

          <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
            {post.title}
          </h3>

          <div className="flex items-center gap-3 text-xs font-medium text-secondary flex-wrap mt-2">
            <button
              className="flex items-center gap-1.5 hover:text-neon transition-colors"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Comments</span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:text-neon transition-colors"
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
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
