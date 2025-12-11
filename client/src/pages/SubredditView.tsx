import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchSubredditListing } from "../api";

interface Listing {
  data: {
    children: { data: Post }[];
  };
}

export interface Post {
  id: string;
  title: string;
  author: string;
  score: number;
  subreddit?: string;
  thumbnail?: string;
  permalink?: string;
}

const SubredditView = () => {
  const { subreddit = "all" } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const navigate = useNavigate();

  const cacheKey = useMemo(() => `cache:subreddit:${subreddit}`, [subreddit]);

  const mapListing = (data: Listing) =>
    data.data.children.map((c) => ({
      id: c.data.id,
      title: c.data.title,
      author: c.data.author,
      score: c.data.score,
      subreddit: c.data.subreddit,
      thumbnail: c.data.thumbnail,
      permalink: c.data.permalink,
    }));

  const load = useCallback(
    async (cursor = "", append = false) => {
      if (append) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await fetchSubredditListing(subreddit, cursor);
        const mapped = mapListing(data as Listing);
        const nextAfter = data?.data?.after ?? null;
        setAfter(nextAfter);
        setPosts((prev) => {
          const nextPosts = append ? [...prev, ...mapped] : mapped;
          if (typeof window !== "undefined") {
            localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), after: nextAfter, posts: nextPosts }));
          }
          return nextPosts;
        });
        setFromCache(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cacheKey, subreddit]
  );

  useEffect(() => {
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { posts: Post[]; after: string | null };
        setPosts(parsed.posts || []);
        setAfter(parsed.after || null);
        setFromCache(true);
      } catch {
        // ignore parse errors
      }
    }
    load();
  }, [cacheKey, load]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey) return;
      if (e.key === "j") {
        setSelectedIndex((idx) => Math.min(posts.length - 1, idx + 1));
      } else if (e.key === "k") {
        setSelectedIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0 && posts[selectedIndex]) {
        navigate(`/post/${posts[selectedIndex].id}`);
      } else if (e.key.toLowerCase() === "g") {
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Subreddit"]');
        input?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, posts, selectedIndex]);

  if (loading) return <LoadingSpinner label={`Loading r/${subreddit}`} />;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-4">
      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {posts.length === 0 && !error && (
        <div className="text-center py-12 text-secondary">
          No posts found.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:gap-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onOpen={() => navigate(`/post/${post.id}`)} />
        ))}
      </div>

      {after && (
        <div className="flex justify-center pt-4">
          <button
            className="btn btn-primary rounded-full px-6"
            onClick={() => load(after, true)}
            disabled={refreshing}
          >
            {refreshing ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubredditView;
