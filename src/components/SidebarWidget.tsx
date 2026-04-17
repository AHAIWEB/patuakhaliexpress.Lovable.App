import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp } from "lucide-react";

interface MiniPost {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string;
}

const SidebarWidget = () => {
  const [latest, setLatest] = useState<MiniPost[]>([]);
  const [popular, setPopular] = useState<MiniPost[]>([]);

  useEffect(() => {
    (async () => {
      const select = "id,title,slug,image_url,published_at";
      const [{ data: lat }, { data: pop }] = await Promise.all([
        supabase
          .from("posts")
          .select(select)
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(6),
        supabase.rpc("get_popular_posts", { _days: 7, _limit: 6 }),
      ]);
      setLatest((lat as MiniPost[]) ?? []);
      const popArr = (pop as MiniPost[] | null) ?? [];
      // Fallback: if no views in last 7 days, show featured posts
      if (popArr.length === 0) {
        const { data: feat } = await supabase
          .from("posts")
          .select(select)
          .eq("is_published", true)
          .eq("is_featured", true)
          .order("published_at", { ascending: false })
          .limit(6);
        setPopular((feat as MiniPost[]) ?? []);
      } else {
        setPopular(popArr);
      }
    })();
  }, []);

  const renderList = (items: MiniPost[]) => (
    <ul className="space-y-3">
      {items.map((p, i) => (
        <li key={p.id}>
          <Link to={`/post/${p.slug}`} className="group flex gap-3">
            <span className="font-headline text-xl text-primary/60 leading-none w-5 flex-shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium leading-snug text-headline group-hover:text-primary line-clamp-3 transition-colors">
                {p.title}
              </h4>
            </div>
          </Link>
        </li>
      ))}
      {items.length === 0 && <li className="text-xs text-muted-foreground">কোনো পোস্ট নেই</li>}
    </ul>
  );

  return (
    <aside className="space-y-6">
      <section className="bg-card border border-border p-4">
        <h3 className="flex items-center gap-2 font-headline text-base text-headline border-b-2 border-primary pb-2 mb-3">
          <Clock className="h-4 w-4" /> সর্বশেষ
        </h3>
        {renderList(latest)}
      </section>
      <section className="bg-card border border-border p-4">
        <h3 className="flex items-center gap-2 font-headline text-base text-headline border-b-2 border-primary pb-2 mb-3">
          <TrendingUp className="h-4 w-4" /> সর্বাধিক পঠিত (৭ দিন)
        </h3>
        {renderList(popular)}
      </section>
    </aside>
  );
};

export default SidebarWidget;
