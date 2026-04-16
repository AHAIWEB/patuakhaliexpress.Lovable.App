import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotocardModal from "@/components/PhotocardModal";
import ShareButtons from "@/components/ShareButtons";
import RelatedPosts from "@/components/RelatedPosts";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  source_url: string | null;
  published_at: string;
  post_type: "auto" | "manual";
  category_id: string | null;
  category: { name: string; slug: string } | null;
  source: { name: string; logo_url: string | null } | null;
}

const truncateForFairUse = (text: string | null) => {
  if (!text) return "";
  const half = Math.floor(text.length * 0.5);
  return text.slice(0, half);
};

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [photocardOpen, setPhotocardOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("posts")
      .select(
        "id,title,excerpt,content,image_url,source_url,published_at,post_type,category_id,category:categories(name,slug),source:sources(name,logo_url)"
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data as Post | null);
        if (data) document.title = `${data.title} — পটুয়াখালী এক্সপ্রেস`;
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container-news py-10 text-muted-foreground">লোড হচ্ছে...</main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container-news py-10">
          <h1 className="font-headline text-2xl text-headline">পোস্ট পাওয়া যায়নি</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const isAggregated = post.post_type === "auto";
  const displayContent = isAggregated
    ? truncateForFairUse(post.content)
    : post.content ?? "";

  const publishedAt = new Date(post.published_at).toLocaleString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const photocardSeed = [post.title, post.excerpt, post.content?.slice(0, 1500)]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6 max-w-3xl">
        <article>
          {post.category && (
            <Link to={`/category/${post.category.slug}`} className="category-tag">
              {post.category.name}
            </Link>
          )}
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-headline mt-3 leading-tight">
            {post.title}
          </h1>
          <div className="text-sm text-meta mt-3 flex flex-wrap items-center gap-2">
            {post.source?.name && (
              <>
                <span className="font-medium">{post.source.name}</span>
                <span>•</span>
              </>
            )}
            <span>{publishedAt}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPhotocardOpen(true)}
            >
              <ImageIcon className="h-4 w-4 mr-1" /> ফটোকার্ড বানান
            </Button>
            <ShareButtons title={post.title} compact />
          </div>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full mt-4 bg-muted"
              loading="lazy"
            />
          )}

          {post.excerpt && (
            <p className="text-lg text-muted-foreground mt-5 leading-relaxed font-medium">
              {post.excerpt}
            </p>
          )}

          {displayContent && (
            <div className="prose prose-lg max-w-none mt-5 text-foreground whitespace-pre-line leading-relaxed">
              {displayContent}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <ShareButtons title={post.title} />
          </div>

          {isAggregated && post.source_url && (
            <div className="mt-6 p-4 border border-border bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-2">
                এই সংবাদের সম্পূর্ণ অংশ পড়তে মূল সোর্সে যান —
              </p>
              <a
                href={post.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors"
              >
                আরও পড়ুন <ExternalLink className="h-4 w-4" />
              </a>
              {post.source?.name && (
                <p className="text-xs text-meta mt-2">সোর্স: {post.source.name}</p>
              )}
            </div>
          )}
        </article>

        <RelatedPosts categoryId={post.category_id} excludeId={post.id} />

        <PhotocardModal
          open={photocardOpen}
          onOpenChange={setPhotocardOpen}
          sourceUrl={post.source_url ?? undefined}
          defaultText={photocardSeed}
        />
      </main>
      <Footer />
    </div>
  );
};

export default PostPage;
