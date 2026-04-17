import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostCard, { PostCardData } from "@/components/PostCard";
import SidebarWidget from "@/components/SidebarWidget";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { MapPin } from "lucide-react";

const PAGE_SIZE = 10;
const SELECT =
  "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

type GeoLevel = "division" | "district" | "upazila";

interface Props {
  level: GeoLevel;
}

const tableFor = (l: GeoLevel) =>
  l === "division" ? "divisions" : l === "district" ? "districts" : "upazilas";
const columnFor = (l: GeoLevel) =>
  l === "division" ? "division_id" : l === "district" ? "district_id" : "upazila_id";
const labelFor = (l: GeoLevel) =>
  l === "division" ? "বিভাগ" : l === "district" ? "জেলা" : "উপজেলা";

const GeoPage = ({ level }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  const [geoId, setGeoId] = useState<string | null>(null);
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
      const { data: geo } = await supabase
        .from(tableFor(level) as "divisions" | "districts" | "upazilas")
        .select("id,bn_name")
        .eq("slug", slug)
        .maybeSingle();
      if (geo) {
        setName(geo.bn_name);
        setGeoId(geo.id);
        document.title = `${geo.bn_name} ${labelFor(level)} — পটুয়াখালী এক্সপ্রেস`;
        const { data } = await supabase
          .from("posts")
          .select(SELECT)
          .eq("is_published", true)
          .eq(columnFor(level), geo.id)
          .order("published_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);
        const arr = (data as PostCardData[]) ?? [];
        setPosts(arr);
        setHasMore(arr.length === PAGE_SIZE);
      }
      setLoading(false);
    })();
  }, [slug, level]);

  const loadMore = async () => {
    if (!geoId) return;
    setLoadingMore(true);
    const next = page + 1;
    const from = next * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("posts")
      .select(SELECT)
      .eq("is_published", true)
      .eq(columnFor(level), geoId)
      .order("published_at", { ascending: false })
      .range(from, to);
    const arr = (data as PostCardData[]) ?? [];
    setPosts((prev) => [...prev, ...arr]);
    setPage(next);
    setHasMore(arr.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading: loadingMore });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6">
        <div className="border-b-2 border-primary pb-2 mb-6">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {labelFor(level)}
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl text-headline">
            {name || "লোড হচ্ছে..."}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {loading ? (
              <p className="text-muted-foreground">লোড হচ্ছে...</p>
            ) : posts.length === 0 ? (
              <p className="text-muted-foreground">এই {labelFor(level)} এ কোনো পোস্ট নেই।</p>
            ) : (
              <>
                <div className="space-y-5">
                  {posts.map((p) => (
                    <PostCard key={p.id} post={p} variant="wide" />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-10" />
                {loadingMore && (
                  <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>
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

export default GeoPage;
