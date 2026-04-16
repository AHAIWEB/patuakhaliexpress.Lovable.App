import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Item {
  id: string;
  title: string;
  slug: string;
}

const BreakingTicker = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id,title,slug")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  if (!items.length) return null;

  return (
    <div className="bg-secondary border-b border-border overflow-hidden">
      <div className="container-news flex items-center gap-3 py-2">
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 uppercase whitespace-nowrap">
          ব্রেকিং
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 whitespace-nowrap animate-marquee">
            {items.concat(items).map((it, i) => (
              <Link
                key={`${it.id}-${i}`}
                to={`/post/${it.slug}`}
                className="text-sm text-headline hover:text-primary transition-colors"
              >
                • {it.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
