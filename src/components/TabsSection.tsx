import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PostCard, { PostCardData } from "./PostCard";

interface TabConfig {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  title: string;
  categoryIds: string[];
  itemCount: number;
  cardStyle?: "default" | "editorial" | "boxed" | "visual";
}

const SELECT =
  "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)";

const TabsSection = ({ title, categoryIds, itemCount, cardStyle = "visual" }: Props) => {
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [active, setActive] = useState<string>("");
  const [postsByTab, setPostsByTab] = useState<Record<string, PostCardData[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryIds.length) return;
    (async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id,name,slug")
        .in("id", categoryIds);
      // Preserve admin-defined order
      const ordered: TabConfig[] = categoryIds
        .map((id) => cats?.find((c) => c.id === id))
        .filter(Boolean) as TabConfig[];
      setTabs(ordered);
      if (ordered.length) setActive(ordered[0].id);
    })();
  }, [categoryIds.join(",")]);

  useEffect(() => {
    if (!active || postsByTab[active]) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select(SELECT)
        .eq("is_published", true)
        .eq("category_id", active)
        .order("published_at", { ascending: false })
        .limit(itemCount || 6);
      setPostsByTab((prev) => ({ ...prev, [active]: (data as PostCardData[]) ?? [] }));
      setLoading(false);
    })();
  }, [active, itemCount]);

  if (!tabs.length) return null;
  const activeTab = tabs.find((t) => t.id === active);
  const posts = postsByTab[active] ?? [];

  return (
    <section className="py-6">
      <div className="flex items-end justify-between mb-4 border-b-2 border-foreground/10">
        <h2 className="font-headline text-lg sm:text-xl text-headline mr-3 pb-2 shrink-0">
          {title}
        </h2>
        <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-thin -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`whitespace-nowrap px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                active === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {loading && !posts.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">লোড হচ্ছে...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">কোনো পোস্ট নেই</p>
      ) : (
        <>
          {cardStyle === "editorial" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <PostCard post={posts[0]} variant="lead" />
              <div className="space-y-4">
                {posts.slice(1, 5).map((p) => (
                  <PostCard key={p.id} post={p} variant="compact" />
                ))}
              </div>
            </div>
          ) : cardStyle === "boxed" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <div key={p.id} className={`rounded-md border border-border bg-card p-2 ${i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}>
                  <PostCard post={p} variant={i === 0 ? "lead" : "default"} />
                </div>
              ))}
            </div>
          ) : cardStyle === "default" ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="grid gap-4 sm:grid-cols-2">
                {posts.slice(0, 4).map((p, i) => (
                  <PostCard key={p.id} post={p} variant={i === 0 ? "lead" : "default"} />
                ))}
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <div className="space-y-3">
                  {posts.slice(4, 8).map((p) => (
                    <PostCard key={p.id} post={p} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab && (
            <div className="mt-4 text-right">
              <Link
                to={`/category/${activeTab.slug}`}
                className="text-xs sm:text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                আরও {activeTab.name} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default TabsSection;
