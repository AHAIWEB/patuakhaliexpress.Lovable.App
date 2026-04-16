import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostCard, { PostCardData } from "@/components/PostCard";
import SidebarWidget from "@/components/SidebarWidget";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;
const SELECT =
  "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setPosts([]);
    setPage(0);
    setHasMore(true);
    (async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("id,name")
        .eq("slug", slug)
        .maybeSingle();
      if (cat) {
        setName(cat.name);
        setCatId(cat.id);
        document.title = `${cat.name} — পটুয়াখালী এক্সপ্রেস`;
        const { data } = await supabase
          .from("posts")
          .select(SELECT)
          .eq("is_published", true)
          .eq("category_id", cat.id)
          .order("published_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);
        const arr = (data as PostCardData[]) ?? [];
        setPosts(arr);
        setHasMore(arr.length === PAGE_SIZE);
      }
      setLoading(false);
    })();
  }, [slug]);

  const loadMore = async () => {
    if (!catId) return;
    setLoadingMore(true);
    const next = page + 1;
    const from = next * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("posts")
      .select(SELECT)
      .eq("is_published", true)
      .eq("category_id", catId)
      .order("published_at", { ascending: false })
      .range(from, to);
    const arr = (data as PostCardData[]) ?? [];
    setPosts((prev) => [...prev, ...arr]);
    setPage(next);
    setHasMore(arr.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-headline border-b-2 border-primary pb-2 mb-6">
          {name || "ক্যাটাগরি"}
        </h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {loading ? (
              <p className="text-muted-foreground">লোড হচ্ছে...</p>
            ) : posts.length === 0 ? (
              <p className="text-muted-foreground">এই ক্যাটাগরিতে কোনো পোস্ট নেই।</p>
            ) : (
              <>
                <div className="space-y-5">
                  {posts.map((p) => (
                    <PostCard key={p.id} post={p} variant="wide" />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center mt-6">
                    <Button onClick={loadMore} disabled={loadingMore} variant="outline">
                      {loadingMore ? "লোড হচ্ছে..." : "আরও দেখুন"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <SidebarWidget />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
