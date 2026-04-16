import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PostCard, { PostCardData } from "@/components/PostCard";

interface Props {
  categoryId: string | null;
  excludeId: string;
}

const RelatedPosts = ({ categoryId, excludeId }: Props) => {
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select(
          "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)"
        )
        .eq("is_published", true)
        .eq("category_id", categoryId)
        .neq("id", excludeId)
        .order("published_at", { ascending: false })
        .limit(6);
      setPosts((data as PostCardData[]) ?? []);
      setLoading(false);
    })();
  }, [categoryId, excludeId]);

  if (loading || posts.length === 0) return null;

  return (
    <section className="mt-10 pt-6 border-t-2 border-primary">
      <h2 className="font-headline text-xl sm:text-2xl text-headline mb-4">
        সম্পর্কিত সংবাদ
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
