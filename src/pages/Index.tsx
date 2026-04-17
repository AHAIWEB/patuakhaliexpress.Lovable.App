import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingTicker from "@/components/BreakingTicker";
import CategorySection from "@/components/CategorySection";
import PostCard, { PostCardData } from "@/components/PostCard";
import SidebarWidget from "@/components/SidebarWidget";
import DivisionsTabs from "@/components/DivisionsTabs";
import { Link } from "react-router-dom";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface HomeSection {
  id: string;
  title: string;
  section_type: string;
  category_id: string | null;
  division_id: string | null;
  variant: string;
  item_count: number;
  display_order: number;
}

const PAGE_SIZE = 9;
const SELECT =
  "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

const Index = () => {
  const [featured, setFeatured] = useState<PostCardData[]>([]);
  const [latest, setLatest] = useState<PostCardData[]>([]);
  const [latestPage, setLatestPage] = useState(0);
  const [latestHasMore, setLatestHasMore] = useState(true);
  const [latestLoading, setLatestLoading] = useState(false);
  const [sections, setSections] = useState<
    Array<HomeSection & { posts: PostCardData[]; slug: string }>
  >([]);

  useEffect(() => {
    document.title = "পটুয়াখালী এক্সপ্রেস — সর্বশেষ বাংলা সংবাদ";

    (async () => {
      const [{ data: feat }, { data: lat }, { data: secs }] = await Promise.all([
        supabase
          .from("posts")
          .select(SELECT)
          .eq("is_published", true)
          .eq("is_featured", true)
          .order("published_at", { ascending: false })
          .limit(5),
        supabase
          .from("posts")
          .select(SELECT)
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .range(0, PAGE_SIZE - 1),
        supabase
          .from("home_sections")
          .select(
            "id,title,section_type,category_id,division_id,variant,item_count,display_order"
          )
          .eq("is_visible", true)
          .order("display_order"),
      ]);

      setFeatured((feat as PostCardData[]) ?? []);
      const latestArr = (lat as PostCardData[]) ?? [];
      setLatest(latestArr);
      setLatestHasMore(latestArr.length === PAGE_SIZE);

      const builtSections = await Promise.all(
        (secs ?? []).map(async (s) => {
          let q = supabase
            .from("posts")
            .select(SELECT)
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(s.item_count || 6);
          let slug = "";
          if (s.section_type === "category" && s.category_id) {
            q = q.eq("category_id", s.category_id);
            const { data } = await supabase
              .from("categories")
              .select("slug")
              .eq("id", s.category_id)
              .maybeSingle();
            slug = data?.slug ?? "";
          } else if (s.section_type === "division" && s.division_id) {
            q = q.eq("division_id", s.division_id);
            const { data } = await supabase
              .from("divisions")
              .select("slug")
              .eq("id", s.division_id)
              .maybeSingle();
            slug = data?.slug ?? "";
          }
          const { data: posts } = await q;
          return { ...s, posts: (posts as PostCardData[]) ?? [], slug };
        })
      );
      setSections(builtSections);
    })();
  }, []);

  const loadMore = async () => {
    setLatestLoading(true);
    const next = latestPage + 1;
    const from = next * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("posts")
      .select(SELECT)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(from, to);
    const arr = (data as PostCardData[]) ?? [];
    setLatest((prev) => [...prev, ...arr]);
    setLatestPage(next);
    setLatestHasMore(arr.length === PAGE_SIZE);
    setLatestLoading(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, {
    hasMore: latestHasMore,
    loading: latestLoading,
  });

  const lead = featured[0] ?? latest[0];
  const sideFeatured = featured.slice(1, 5).length ? featured.slice(1, 5) : latest.slice(1, 5);
  const showFeaturedBlock = !!lead;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <BreakingTicker />

      <main className="flex-1 container-news py-5">
        {showFeaturedBlock ? (
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PostCard post={lead} variant="lead" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {sideFeatured.map((p) => (
                <PostCard key={p.id} post={p} variant="compact" />
              ))}
            </div>
          </section>
        ) : (
          <section className="py-16 text-center">
            <h1 className="font-headline text-3xl sm:text-4xl text-headline mb-3">
              পটুয়াখালী এক্সপ্রেসে স্বাগতম
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              এখনো কোনো পোস্ট নেই। এডমিন প্যানেলে গিয়ে স্ক্রেপার চালু করুন বা ম্যানুয়ালি পোস্ট
              যুক্ত করুন।
            </p>
            <Link
              to="/auth"
              className="inline-block mt-4 bg-primary text-primary-foreground px-5 py-2.5 rounded font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors"
            >
              এডমিন লগইন
            </Link>
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_300px] mt-2">
          <div className="min-w-0">
            {sections.map((s) => (
              <CategorySection
                key={s.id}
                title={s.title}
                slug={s.slug}
                posts={s.posts}
              />
            ))}

            {latest.length > 0 && (
              <section className="py-6">
                <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
                  <h2 className="font-headline text-xl sm:text-2xl text-headline">সর্বশেষ সংবাদ</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {latest.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-10" />
                {latestLoading && (
                  <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>
                )}
              </section>
            )}
          </div>
          <SidebarWidget />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
