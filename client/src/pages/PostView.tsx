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

const renderComments = (
  nodes: ListingChild<CommentData>[],
  depth = 0,
  handlers?: { onReply: (id: string) => void; onShare: (id: string) => void }
) =>
  nodes
    .filter((n) => n?.data?.body)
    .map((node) => {
      const childReplies =
        node.data.replies && typeof node.data.replies !== "string"
          ? node.data.replies.data.children
          : [];
      return (
        <div
          key={node.data.id}
          id={`comment-${node.data.id}`}
          className={`mt-3 ${depth > 0 ? "ml-3 sm:ml-5 pl-3 border-l-2 border-border hover:border-secondary/50 transition-colors" : ""}`}
        >
          <div className="py-1 group">
            <div className="flex items-center gap-2 text-xs text-secondary mb-1">
              <span className="font-bold text-neon">{node.data.author || "anon"}</span>
              <span>•</span>
              <span>{node.data.score} points</span>
            </div>
            <div className="text-sm leading-relaxed text-neon whitespace-pre-wrap break-words">{node.data.body}</div>

            <div className="flex gap-3 mt-1.5 text-xs text-secondary font-medium opacity-50 group-hover:opacity-100 transition-opacity">
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
  const [vote, setVote] = useState<"up" | "down" | null>(null);

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
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="card mb-4 p-4">
        <div className="flex items-center gap-2 text-xs text-secondary mb-2">
          <span className="font-bold text-neon">r/subreddit</span>
          <span>•</span>
          <span>Posted by u/{post?.author}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-medium mb-3 leading-snug text-neon">{post?.title}</h1>

        {post?.selftext && (
          <div className="text-sm sm:text-base leading-relaxed text-neon whitespace-pre-wrap mb-4">
            {post.selftext}
          </div>
        )}

        {post?.thumbnail && post.thumbnail.startsWith("http") && (
            <div className="mb-4 flex justify-center bg-black/20 rounded overflow-hidden">
              <img src={post.thumbnail} alt="content" className="max-h-[600px] object-contain" />
            </div>
        )}

        {post?.url && !post.url.includes(post.permalink || "reddit") && (
            <a href={post.url} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline block mb-4 break-all">
              {post.url}
            </a>
        )}

        <div className="flex items-center gap-4 text-xs font-medium text-secondary border-t border-border pt-3">
          <div className="flex items-center gap-1 bg-base/50 rounded px-2 py-1 border border-border/50">
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

          <button className="flex items-center gap-1.5 hover:bg-base/50 px-2 py-1 rounded transition-colors hover:text-neon" onClick={() => setActionMessage("Scroll to comments") }>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{comments.length} Comments</span>
          </button>
          <button className="flex items-center gap-1.5 hover:bg-base/50 px-2 py-1 rounded transition-colors hover:text-neon" onClick={handleShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>Share</span>
          </button>
          <button className="flex items-center gap-1.5 hover:bg-base/50 px-2 py-1 rounded transition-colors hover:text-neon" onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
          <h2 className="text-lg font-medium">Comments</h2>
        </div>
        {comments.length === 0 ? (
          <p className="text-sm text-secondary">No comments yet.</p>
        ) : (
          <div className="space-y-4">{renderComments(comments, 0, { onReply: handleCommentReply, onShare: handleCommentShare })}</div>
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
