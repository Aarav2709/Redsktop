import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiUrl } from "../api";

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
  const { subreddit = "technology" } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/r/${subreddit}`));
      if (!res.ok) throw new Error("Failed to load feed");
      const data = (await res.json()) as Listing;
      const mapped = data.data.children.map((c) => ({
        id: c.data.id,
        title: c.data.title,
        author: c.data.author,
        score: c.data.score,
        subreddit: c.data.subreddit,
        thumbnail: c.data.thumbnail,
        permalink: c.data.permalink,
      }));
      setPosts(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [subreddit]);

  useEffect(() => {
    load();
  }, [load]);

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
    </div>
  );
};

export default SubredditView;
