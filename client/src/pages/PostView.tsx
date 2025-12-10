import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiUrl, postAction } from "../api";
import { useAuth } from "../auth/AuthContext";

type ListingChild<T> = { data: T };

interface PostData {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  subreddit?: string;
  url?: string;
  thumbnail?: string;
  permalink?: string;
}

interface CommentData {
  id: string;
  author: string;
  body: string;
  score: number;
  replies?: { data: { children: ListingChild<CommentData>[] } } | string;
}

type CommentVote = "up" | "down" | null;

const renderComments = (
  nodes: ListingChild<CommentData>[],
  depth = 0,
  handlers?: {
    onReply: (id: string) => void;
    onShare: (id: string) => void;
    onVote: (id: string, direction: CommentVote) => void;
    votes: Record<string, { score: number; vote: CommentVote }>;
  }
) =>
  nodes
    .filter((n) => n?.data?.body)
    .map((node) => {
      const childReplies =
        node.data.replies && typeof node.data.replies !== "string"
          ? node.data.replies.data.children
          : [];

      const voteState = handlers?.votes?.[node.data.id];
      const score = voteState?.score ?? node.data.score;
      const vote = voteState?.vote ?? null;

      return (
        <div
          key={node.data.id}
          id={`comment-${node.data.id}`}
          className={`mt-3 ${depth > 0 ? "ml-3 sm:ml-5 pl-3 border-l-2 border-border/70 hover:border-accent/50 transition-colors" : ""}`}
        >
          <div className="py-3 px-3 rounded-xl bg-surface/50 hover:bg-surface/70 transition-colors group border border-border/70 shadow-inner shadow-black/20">
            <div className="flex items-center gap-2 text-xs text-secondary mb-1 flex-wrap">
              <span className="font-bold text-neon">{node.data.author || "anon"}</span>
              <span>•</span>
              <span>{score} points</span>
            </div>
            <div className="text-sm leading-relaxed text-neon whitespace-pre-wrap break-words">{node.data.body}</div>

            <div className="flex items-center gap-3 mt-2 text-xs text-secondary font-medium opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 bg-surface/60 border border-border/60 rounded-full px-2 py-0.5">
                <button
                  className={`p-1 rounded hover:text-accent ${vote === "up" ? "text-accent" : ""}`}
                  onClick={() => handlers?.onVote(node.data.id, "up")}
                  aria-label="Upvote comment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </button>
                <span className={`min-w-[2ch] text-center ${vote ? "text-accent" : ""}`}>{score}</span>
                <button
                  className={`p-1 rounded hover:text-indigo-400 ${vote === "down" ? "text-indigo-400" : ""}`}
                  onClick={() => handlers?.onVote(node.data.id, "down")}
                  aria-label="Downvote comment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </div>

              <button className="hover:text-neon" onClick={() => handlers?.onReply(node.data.id)}>Reply</button>
              <button className="hover:text-neon" onClick={() => handlers?.onShare(node.data.id)}>Share</button>
            </div>
          </div>
          {childReplies.length > 0 && renderComments(childReplies, depth + 1, handlers)}
        </div>
      );
    });

const PostView = () => {
  const { id } = useParams();
  const { token, ensureAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<ListingChild<CommentData>[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [vote, setVote] = useState<CommentVote>(null);
  const [commentVotes, setCommentVotes] = useState<Record<string, { score: number; vote: CommentVote }>>({});

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/api/post/${id}`));
        if (!res.ok) throw new Error("Unable to load post");
        const json = (await res.json()) as [{ data: { children: ListingChild<PostData>[] } }, { data: { children: ListingChild<CommentData>[] } }];
        const postListing = json?.[0]?.data?.children?.[0]?.data;
        if (postListing) {
          setPost(postListing);
          setScore(postListing.score ?? null);
        }
        const commentNodes = json?.[1]?.data?.children ?? [];
        setComments(commentNodes);
        const initialVotes: Record<string, { score: number; vote: CommentVote }> = {};
        commentNodes.forEach((c) => {
          if (c?.data?.id) {
            initialVotes[c.data.id] = { score: c.data.score, vote: null };
          }
        });
        setCommentVotes(initialVotes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleVote = async (direction: "up" | "down") => {
    if (!ensureAuth() || !token || !post || score === null) return;
    if (vote === direction) return;

    const prevVote = vote;
    const prevScore = score;
    const delta = (direction === "up" ? 1 : -1) + (prevVote === "up" ? -1 : prevVote === "down" ? 1 : 0);

    setVote(direction);
    setScore((s) => (s ?? 0) + delta);

    try {
      await postAction("vote", { id: post.id, direction }, token);
      setActionMessage(direction === "up" ? "Upvoted" : "Downvoted");
    } catch (err) {
      setVote(prevVote);
      setScore(prevScore);
      setActionMessage("Vote failed");
    }
  };

  const handleSave = async () => {
    if (!ensureAuth() || !token || !post) return;
    await postAction("save", { id: post.id }, token);
    setActionMessage("Saved");
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
      setActionMessage("Shared");
      return;
    }
    await navigator.clipboard.writeText(url);
    setActionMessage("Link copied");
  };

  const handleCommentReply = (commentId: string) => {
    if (!ensureAuth()) return;
    setActionMessage(`Reply coming soon (comment ${commentId})`);
  };

  const handleCommentVote = (commentId: string, direction: CommentVote) => {
    if (!ensureAuth()) return;
    setCommentVotes((prev) => {
      const current = prev[commentId] ?? { score: comments.find((c) => c.data.id === commentId)?.data.score ?? 0, vote: null };
      if (current.vote === direction) return prev;
      const delta = (direction === "up" ? 1 : -1) + (current.vote === "up" ? -1 : current.vote === "down" ? 1 : 0);
      return {
        ...prev,
        [commentId]: { score: current.score + delta, vote: direction },
      };
    });
  };

  const handleCommentShare = async (commentId: string) => {
    const url = `${window.location.origin}/post/${post?.id ?? ""}#comment-${commentId}`;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    setActionMessage("Comment link copied");
  };

  if (loading) return <LoadingSpinner label="Loading post" />;
  if (error) return <div className="glass p-4 text-danger border border-danger/30 bg-danger/10">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5">
      <div className="glass p-5 sm:p-6">
        <div className="flex items-start sm:items-center gap-3 text-xs text-secondary mb-2 flex-wrap">
          <span className="pill bg-accent/10 border-accent/30 text-accent">r/{post?.subreddit || "subreddit"}</span>
          <span className="pill bg-surface/70">u/{post?.author}</span>
          <span className="pill bg-surface/70">Score {score ?? post?.score ?? 0}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 leading-snug text-neon">{post?.title}</h1>

        {post?.selftext && (
          <div className="text-sm sm:text-base leading-relaxed text-neon whitespace-pre-wrap mb-4 bg-surface/40 border border-border/70 rounded-xl p-4">
            {post.selftext}
          </div>
        )}

        {post?.thumbnail && post.thumbnail.startsWith("http") && (
          <div className="mb-4 flex justify-center bg-black/20 rounded-2xl overflow-hidden border border-border/70">
            <img src={post.thumbnail} alt="content" className="max-h-[600px] object-contain" />
          </div>
        )}

        {post?.url && !post.url.includes(post.permalink || "reddit") && (
          <a href={post.url} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline block mb-4 break-all">
            {post.url}
          </a>
        )}

        <div className="flex items-center gap-3 text-xs font-medium text-secondary border-t border-border pt-3 flex-wrap">
          <div className="flex items-center gap-1 bg-base/60 rounded-full px-3 py-1 border border-border/60 shadow-inner shadow-black/30">
            <button
              className={`hover:text-accent p-1 transition-colors ${vote === "up" ? "text-accent" : ""}`}
              onClick={() => handleVote("up")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
            <span className={`min-w-[2ch] text-center ${vote ? "text-accent" : ""}`}>{score ?? 0}</span>
            <button
              className={`hover:text-blue-500 p-1 transition-colors ${vote === "down" ? "text-blue-500" : ""}`}
              onClick={() => handleVote("down")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <button className="flex items-center gap-1.5 hover:bg-base/50 px-3 py-1 rounded-full transition-colors hover:text-neon border border-transparent hover:border-border/70" onClick={() => setActionMessage("Scroll to comments")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{comments.length} Comments</span>
          </button>
          <button className="flex items-center gap-1.5 hover:bg-base/50 px-3 py-1 rounded-full transition-colors hover:text-neon border border-transparent hover:border-border/70" onClick={handleShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>Share</span>
          </button>
          <button className="flex items-center gap-1.5 hover:bg-base/50 px-3 py-1 rounded-full transition-colors hover:text-neon border border-transparent hover:border-border/70" onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="glass p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border/70 pb-2">
          <div>
            <p className="pill bg-surface/70 text-secondary">Comments</p>
            <h2 className="text-lg font-semibold mt-1">What the community says</h2>
          </div>
          <span className="text-secondary text-xs">{comments.length} threads</span>
        </div>
        {comments.length === 0 ? (
          <p className="text-sm text-secondary">No comments yet.</p>
        ) : (
          <div className="space-y-4">{renderComments(comments, 0, { onReply: handleCommentReply, onShare: handleCommentShare, onVote: handleCommentVote, votes: commentVotes })}</div>
        )}
      </div>

      {actionMessage && (
        <div className="fixed bottom-4 right-4 bg-accent text-white px-4 py-2 rounded shadow-lg text-sm animate-fade-in-up">
          {actionMessage}
        </div>
      )}
    </div>
  );
};

export default PostView;
