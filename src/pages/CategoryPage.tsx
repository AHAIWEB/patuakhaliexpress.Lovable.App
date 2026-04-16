import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostCard, { PostCardData } from "@/components/PostCard";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("id,name")
        .eq("slug", slug)
        .maybeSingle();
      if (cat) {
        setName(cat.name);
        document.title = `${cat.name} — পটুয়াখালী এক্সপ্রেস`;
        const { data } = await supabase
          .from("posts")
          .select(
            "id,title,slug,excerpt,image_url,published_at,category:categories(name,slug),source:sources(name,logo_url)"
          )
          .eq("is_published", true)
          .eq("category_id", cat.id)
          .order("published_at", { ascending: false })
          .limit(40);
        setPosts((data as any) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-headline border-b-2 border-primary pb-2 mb-6">
          {name || "ক্যাটাগরি"}
        </h1>
        {loading ? (
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">এই ক্যাটাগরিতে কোনো পোস্ট নেই।</p>
        ) : (
          <div className="space-y-5">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} variant="wide" />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
