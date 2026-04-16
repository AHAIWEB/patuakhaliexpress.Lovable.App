import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingTicker from "@/components/BreakingTicker";
import CategorySection from "@/components/CategorySection";
import PostCard, { PostCardData } from "@/components/PostCard";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  hide_featured: boolean;
}

const Index = () => {
  const [featured, setFeatured] = useState<PostCardData[]>([]);
  const [latest, setLatest] = useState<PostCardData[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, PostCardData[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    document.title = "পটুয়াখালী এক্সপ্রেস — সর্বশেষ বাংলা সংবাদ";

    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id,name,slug,hide_featured")
        .order("display_order");
      setCategories(cats ?? []);

      const select =
        "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

      const { data: feat } = await supabase
        .from("posts")
        .select(select)
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(5);
      setFeatured((feat as any) ?? []);

      const { data: lat } = await supabase
        .from("posts")
        .select(select)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(8);
      setLatest((lat as any) ?? []);

      // Per-category
      if (cats) {
        const map: Record<string, PostCardData[]> = {};
        await Promise.all(
          cats.slice(0, 8).map(async (c) => {
            const { data } = await supabase
              .from("posts")
              .select(select)
              .eq("is_published", true)
              .eq("category_id", c.id)
              .order("published_at", { ascending: false })
              .limit(5);
            map[c.slug] = (data as any) ?? [];
          })
        );
        setByCategory(map);
      }
    })();
  }, []);

  const lead = featured[0] ?? latest[0];
  const sideFeatured = featured.slice(1, 5).length ? featured.slice(1, 5) : latest.slice(1, 5);
  const showFeaturedBlock = !!lead;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <BreakingTicker />

      <main className="flex-1 container-news py-5">
        {/* Featured / Hero */}
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

        {/* Per category sections */}
        {categories
          .filter((c) => !c.hide_featured)
          .map((c) => (
            <CategorySection
              key={c.id}
              title={c.name}
              slug={c.slug}
              posts={byCategory[c.slug] ?? []}
            />
          ))}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
