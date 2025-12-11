import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchPostWithComments } from "../api";

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
  media?: { reddit_video?: { fallback_url?: string } };
  secure_media?: { reddit_video?: { fallback_url?: string } };
  preview?: { images?: Array<{ source?: { url?: string } }> };
}

interface CommentData {
  id: string;
  author: string;
  body: string;
  score: number;
  replies?: { data: { children: ListingChild<CommentData>[] } } | string;
}

const depthColor = "border-accent/70";

const urlRegex = /(https?:\/\/[^\s]+)/gi;

const cleanUrl = (url: string) => url.replace(/&amp;/g, "&");
const decodeEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const isImageUrl = (url: string) => {
  if (/\.(png|jpe?g|gif|webp)$/i.test(url)) return true;
  try {
    const u = new URL(url);
    const fmt = u.searchParams.get("format");
    if (u.hostname.includes("preview.redd.it") && (fmt === "png" || fmt === "jpg" || fmt === "jpeg" || fmt === "webp" || fmt === "gif")) return true;
  } catch (err) {
    // ignore
  }
  return false;
};

const isVideoUrl = (url: string) => /\.(mp4|webm)$/i.test(url) || url.includes("v.redd.it");

const normalizedVideoUrl = (url: string) => {
  if (url.includes("v.redd.it") && !/\.(mp4|webm)$/i.test(url)) {
    return `${url.replace(/\/$/, "")}/DASH_720.mp4`;
  }
  return url;
};

const renderRichText = (text: string) => {
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    const candidate = cleanUrl(part);
    const isLink = /^https?:\/\/\S+$/i.test(candidate);

    if (isLink) {
      if (isImageUrl(candidate)) {
        return (
          <div key={`img-${idx}`} className="mt-2 mb-2 overflow-hidden rounded-xl border border-border/60 bg-black/30">
            <img src={candidate} alt="comment media" className="max-h-96 w-full object-contain" loading="lazy" />
          </div>
        );
      }
      if (isVideoUrl(candidate)) {
        return (
          <div key={`vid-${idx}`} className="mt-2 mb-2 overflow-hidden rounded-xl border border-border/60 bg-black/40">
            <video src={normalizedVideoUrl(candidate)} controls className="w-full" preload="metadata" />
          </div>
        );
      }
      return (
        <a
          key={`link-${idx}`}
          href={candidate}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline break-all"
        >
          {candidate}
        </a>
      );
    }

    const decoded = decodeEntities(candidate);
    return decoded.split(/\n/g).map((line, lineIdx, arr) => (
      <span key={`txt-${idx}-${lineIdx}`} className="text-white">
        {line}
        {lineIdx < arr.length - 1 ? <br /> : null}
      </span>
    ));
  });
};

const renderComments = (
  nodes: ListingChild<CommentData>[],
  depth = 0,
  collapsed: Record<string, boolean> = {},
  handlers?: {
    onShare: (id: string) => void;
    onToggle: (id: string) => void;
  }
) =>
  nodes
    .filter((n) => n?.data?.body)
    .map((node) => {
      const childReplies =
        node.data.replies && typeof node.data.replies !== "string"
          ? node.data.replies.data.children
          : [];

      const isCollapsed = collapsed[node.data.id];
      const borderColor = depthColor;

      return (
        <div
          key={node.data.id}
          id={`comment-${node.data.id}`}
          className={`mt-3 ${depth > 0 ? `ml-3 sm:ml-5 pl-3 border-l-2 ${borderColor} transition-colors` : ""}`}
        >
          <div className="py-3 px-3 rounded-xl bg-surface/50 hover:bg-surface/70 transition-colors group border border-border/70 shadow-inner shadow-black/20">
            <div className="flex items-center gap-2 text-xs text-secondary mb-1 flex-wrap">
              <button
                className="h-6 w-6 rounded-full bg-surface/70 border border-border/60 flex items-center justify-center text-xs hover:text-neon"
                onClick={() => handlers?.onToggle(node.data.id)}
                aria-label={isCollapsed ? "Expand thread" : "Collapse thread"}
              >
                {isCollapsed ? "+" : "–"}
              </button>
              <span className="font-bold text-neon">{node.data.author || "anon"}</span>
              <span>•</span>
              <span>{node.data.score} points</span>
            </div>
            {!isCollapsed && (
              <div className="text-sm leading-relaxed text-neon break-words space-y-2">{renderRichText(node.data.body)}</div>
            )}

            {!isCollapsed && (
              <div className="flex items-center gap-3 mt-2 text-xs text-secondary font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                <button className="hover:text-neon" onClick={() => handlers?.onShare(node.data.id)}>Share</button>
              </div>
            )}
          </div>
          {!isCollapsed && childReplies.length > 0 && renderComments(childReplies, depth + 1, collapsed, handlers)}
        </div>
      );
    });

const PostView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<ListingChild<CommentData>[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const cacheKey = useMemo(() => (id ? `cache:post:${id}` : ""), [id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const json = await fetchPostWithComments(id);
        const postListing = json?.[0]?.data?.children?.[0]?.data;
        if (postListing) {
          setPost(postListing);
        }
        const commentNodes = json?.[1]?.data?.children ?? [];
        setComments(commentNodes);
        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), post: postListing, comments: commentNodes }));
        }
        setFromCache(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    const cached = cacheKey && typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { post: PostData; comments: ListingChild<CommentData>[] };
        setPost(parsed.post);
        setComments(parsed.comments || []);
        setFromCache(true);
      } catch {
        // ignore parse errors
      }
    }
    load();
  }, [cacheKey, id]);

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

  const handleCommentShare = async (commentId: string) => {
    const url = `${window.location.origin}/post/${post?.id ?? ""}#comment-${commentId}`;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
    setActionMessage("Comment link copied");
  };

  const toggleComment = (commentId: string) => {
    setCollapsed((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  if (loading) return <LoadingSpinner label="Loading post" />;
  if (error) return <div className="glass p-4 text-danger border border-danger/30 bg-danger/10">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5">
      <div className="glass p-5 sm:p-6">
        <div className="flex items-start sm:items-center gap-3 text-xs text-secondary mb-2 flex-wrap">
          <span className="pill bg-accent/10 border-accent/30 text-accent">r/{post?.subreddit || "subreddit"}</span>
          <span className="pill bg-surface/70">u/{post?.author}</span>
          <span className="pill bg-surface/70">Score {post?.score ?? 0}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-3 leading-snug text-neon">{post?.title}</h1>

        {post?.selftext && (
          <div className="text-sm sm:text-base leading-relaxed text-white whitespace-pre-wrap mb-4 bg-surface/40 border border-border/70 rounded-xl p-4 space-y-1">
            {renderRichText(post.selftext)}
          </div>
        )}

        {(() => {
          const url = post?.url ? cleanUrl(post.url) : "";
          const previewUrl = cleanUrl(post?.preview?.images?.[0]?.source?.url || "");
          const imageUrl = url && isImageUrl(url) ? url : previewUrl || "";
          const videoUrl =
            post?.secure_media?.reddit_video?.fallback_url ||
            post?.media?.reddit_video?.fallback_url ||
            (url && isVideoUrl(url) ? normalizedVideoUrl(url) : "");

          if (imageUrl) {
            return (
              <div className="mb-4 flex justify-center bg-black/20 rounded-2xl overflow-hidden border border-border/70">
                <img src={cleanUrl(imageUrl)} alt="content" className="max-h-[720px] object-contain" loading="lazy" />
              </div>
            );
          }

          if (videoUrl) {
            return (
              <div className="mb-4 bg-black/40 rounded-2xl overflow-hidden border border-border/70">
                <video src={cleanUrl(videoUrl)} controls className="w-full" preload="metadata" />
              </div>
            );
          }

          if (post?.thumbnail && post.thumbnail.startsWith("http")) {
            return (
              <div className="mb-4 flex justify-center bg-black/20 rounded-2xl overflow-hidden border border-border/70">
                <img src={cleanUrl(post.thumbnail)} alt="content" className="max-h-[600px] object-contain" loading="lazy" />
              </div>
            );
          }

          if (url && !url.includes(post?.permalink || "reddit") && !isImageUrl(url) && !isVideoUrl(url)) {
            return (
              <a href={url} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline block mb-4 break-all">
                {url}
              </a>
            );
          }

          return null;
        })()}

        <div className="flex items-center gap-3 text-xs font-medium text-secondary border-t border-border pt-4 flex-wrap">
          <button
            className="flex items-center gap-1.5 hover:bg-base/50 px-3 py-1 rounded-full transition-colors hover:text-neon border border-transparent hover:border-border/70"
            onClick={() => setActionMessage("Scroll to comments")}
          >
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
        </div>
      </div>

      <div className="glass p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border/70 pb-2">
          <h2 className="text-lg font-semibold">Comments</h2>
          <span className="text-secondary text-xs">{fromCache ? "cached" : ""}</span>
        </div>
        {comments.length === 0 ? (
          <p className="text-sm text-secondary">No comments yet.</p>
        ) : (
          <div className="space-y-4">{renderComments(comments, 0, collapsed, { onShare: handleCommentShare, onToggle: toggleComment })}</div>
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
