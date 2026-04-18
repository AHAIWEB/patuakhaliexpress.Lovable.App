import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreakingTicker from "@/components/BreakingTicker";
import { PostCardData } from "@/components/PostCard";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  HybridLayout,
  MagazineLayout,
  MinimalLayout,
  BoldLayout,
  MasonryLayout,
  ClassicLayout,
  ProthomLayout,
  type HomeLayoutProps,
} from "@/components/home/HomeLayouts";
import type { SectionVariant } from "@/components/CategorySection";

interface HomeSection {
  id: string;
  title: string;
  section_type: string;
  category_id: string | null;
  division_id: string | null;
  variant: string;
  item_count: number;
  display_order: number;
  config: any;
}

const PAGE_SIZE = 9;
const SELECT =
  "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

const Index = () => {
  const settings = useSiteSettings();
  const [featured, setFeatured] = useState<PostCardData[]>([]);
  const [latest, setLatest] = useState<PostCardData[]>([]);
  const [latestPage, setLatestPage] = useState(0);
  const [latestHasMore, setLatestHasMore] = useState(true);
  const [latestLoading, setLatestLoading] = useState(false);
  const [sections, setSections] = useState<
    Array<HomeSection & { posts: PostCardData[]; slug: string }>
  >([]);

  useEffect(() => {
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
            "id,title,section_type,category_id,division_id,variant,item_count,display_order,config"
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
          // Tabs variant manages its own data — skip post fetch
          if (s.variant === "tabs") {
            return { ...s, posts: [] as PostCardData[], slug: "" };
          }
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
  const showFeaturedBlock = !!lead && settings.show_hero_block;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: settings.site_name,
      url: siteUrl,
      logo: settings.og_image_url || `${siteUrl}/placeholder.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.site_name,
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: latest.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl}/post/${p.slug}`,
        name: p.title,
      })),
    },
  ];

  const layoutProps: HomeLayoutProps = {
    lead,
    sideFeatured,
    latest,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      posts: s.posts,
      variant: (s.variant as any) ?? "grid",
      config: s.config ?? null,
      item_count: s.item_count,
    })),
    showFeaturedBlock,
    showDivisionsTabs: settings.show_divisions_tabs,
    showLatestSection: settings.show_latest_section,
    sentinelRef,
    latestLoading,
    siteName: settings.site_name,
  };

  const renderLayout = () => {
    switch (settings.home_theme) {
      case "magazine":
        return <MagazineLayout {...layoutProps} />;
      case "minimal":
        return <MinimalLayout {...layoutProps} />;
      case "bold":
        return <BoldLayout {...layoutProps} />;
      case "masonry":
        return <MasonryLayout {...layoutProps} />;
      case "classic":
        return <ClassicLayout {...layoutProps} />;
      case "prothom":
        return <ProthomLayout {...layoutProps} />;
      case "hybrid":
      default:
        return <HybridLayout {...layoutProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={settings.site_name}
        description={settings.site_description}
        image={settings.og_image_url}
        type="website"
        jsonLd={jsonLd}
      />
      <Header />
      {settings.show_breaking_ticker && <BreakingTicker />}

      <main className="flex-1 container-news py-5 sm:py-6">
        {!lead && (
          <section className="py-16 text-center">
            <h1 className="font-headline text-3xl sm:text-4xl text-headline mb-3">
              {settings.site_name}-এ স্বাগতম
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
        {lead && renderLayout()}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
