import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CategorySection from "@/components/CategorySection";
import type { PostCardData } from "@/components/PostCard";

interface PreviewSection {
  id: string;
  title: string;
  section_type: string;
  category_id: string | null;
  division_id: string | null;
  variant: string;
  item_count: number;
  is_visible: boolean;
  config?: {
    icon?: string | null;
    accent_color?: string | null;
  } | null;
}

interface Props {
  sections: PreviewSection[];
}

const SectionPreview = ({ section }: { section: PreviewSection }) => {
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [catSlug, setCatSlug] = useState("");

  useEffect(() => {
    (async () => {
      let query = supabase
        .from("posts")
        .select("id,title,slug,excerpt,image_url,published_at,category_id,categories(slug,name)")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(section.item_count || 6);

      if (section.section_type === "category" && section.category_id) {
        query = query.eq("category_id", section.category_id);
        const { data: c } = await supabase
          .from("categories").select("slug").eq("id", section.category_id).maybeSingle();
        setCatSlug(c?.slug ?? "");
      } else if (section.section_type === "division" && section.division_id) {
        query = query.eq("division_id", section.division_id);
      }

      const { data } = await query;
      setPosts(
        (data ?? []).map((p: any) => ({
          id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt,
          image_url: p.image_url, published_at: p.published_at,
          category: p.categories ? { name: p.categories.name, slug: p.categories.slug } : null,
        })),
      );
    })();
  }, [section.id, section.section_type, section.category_id, section.division_id, section.variant, section.item_count]);

  return (
    <div className="border border-border bg-background p-3 mb-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        Preview · {section.variant} · {section.item_count} আইটেম
      </div>
      <div className="pointer-events-none scale-[0.88] origin-top-left w-[114%] -mb-12">
        <CategorySection
          title={section.title}
          slug={catSlug}
          posts={posts}
          variant={section.variant as import("@/components/CategorySection").SectionVariant}
          icon={section.config?.icon ?? null}
          accentColor={section.config?.accent_color ?? null}
        />
      </div>
    </div>
  );
};

export default function HomeLayoutPreview({ sections }: Props) {
  const visible = sections.filter((s) => s.is_visible);
  if (!visible.length) return <p className="text-sm text-muted-foreground">দেখানোর মতো সেকশন নেই।</p>;
  return (
    <div className="space-y-2">
      {visible.map((s) => <SectionPreview key={s.id} section={s} />)}
    </div>
  );
}
