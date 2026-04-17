import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PostCard, { PostCardData } from "@/components/PostCard";
import { MapPin } from "lucide-react";

interface Division {
  id: string;
  bn_name: string;
  slug: string;
}

const SELECT =
  "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

const DivisionsTabs = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Record<string, PostCardData[]>>({});

  useEffect(() => {
    supabase
      .from("divisions")
      .select("id,bn_name,slug")
      .order("display_order")
      .then(({ data }) => {
        const arr = (data as Division[]) ?? [];
        setDivisions(arr);
        if (arr.length) setActiveId(arr[0].id);
      });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    if (cache[activeId]) {
      setPosts(cache[activeId]);
      return;
    }
    setLoading(true);
    supabase
      .from("posts")
      .select(SELECT)
      .eq("is_published", true)
      .eq("division_id", activeId)
      .order("published_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        const arr = (data as PostCardData[]) ?? [];
        setCache((c) => ({ ...c, [activeId]: arr }));
        setPosts(arr);
        setLoading(false);
      });
  }, [activeId, cache]);

  if (divisions.length === 0) return null;

  const activeDiv = divisions.find((d) => d.id === activeId);

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-3 border-b-2 border-primary pb-2">
        <h2 className="flex items-center gap-2 font-headline text-xl sm:text-2xl text-headline">
          <MapPin className="h-5 w-5" /> দেশজুড়ে
        </h2>
        {activeDiv && (
          <Link
            to={`/category/${activeDiv.slug}`}
            className="text-xs text-primary hover:underline"
          >
            সব দেখুন →
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-4 -mx-1">
        {divisions.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveId(d.id)}
            className={`px-3 py-1.5 text-sm font-medium border transition-colors ${
              activeId === d.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:border-primary"
            }`}
          >
            {d.bn_name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {activeDiv?.bn_name} বিভাগে এখনো কোনো পোস্ট নেই।
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default DivisionsTabs;
