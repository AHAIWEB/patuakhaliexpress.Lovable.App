import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Facebook } from "lucide-react";

interface Photocard {
  id: string;
  image_url: string | null;
  quote: string | null;
  source_url: string | null;
  created_at: string;
}

const PAGE = 18;

const Gallery = () => {
  const [items, setItems] = useState<Photocard[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "ফটোকার্ড গ্যালারি — পটুয়াখালী এক্সপ্রেস";
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = async (p: number) => {
    setLoading(true);
    const from = p * PAGE;
    const to = from + PAGE - 1;
    const { data } = await supabase
      .from("photocards")
      .select("id,image_url,quote,source_url,created_at")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .range(from, to);
    const arr = (data as Photocard[]) ?? [];
    setItems((prev) => (p === 0 ? arr : [...prev, ...arr]));
    setHasMore(arr.length === PAGE);
    setPage(p);
    setLoading(false);
  };

  const shareFb = (img: string) => {
    const url = encodeURIComponent(img);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500"
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-headline border-b-2 border-primary pb-2 mb-6">
          ফটোকার্ড গ্যালারি
        </h1>

        {items.length === 0 && !loading ? (
          <p className="text-muted-foreground">এখনো কোনো ফটোকার্ড নেই।</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <article key={p.id} className="bg-card border border-border overflow-hidden flex flex-col">
                {p.image_url && (
                  <a href={p.image_url} target="_blank" rel="noopener noreferrer" className="block bg-muted">
                    <img src={p.image_url} alt={p.quote ?? "photocard"} className="w-full h-auto" loading="lazy" />
                  </a>
                )}
                {p.quote && (
                  <blockquote className="p-3 text-sm italic border-l-4 border-primary text-foreground line-clamp-3">
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>
                )}
                <div className="flex items-center gap-1 p-2 border-t border-border bg-secondary/30">
                  {p.image_url && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => shareFb(p.image_url!)} className="text-[#1877F2]">
                        <Facebook className="h-4 w-4 mr-1" /> শেয়ার
                      </Button>
                      <a
                        href={p.image_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs px-2 py-1 hover:text-primary"
                      >
                        <Download className="h-4 w-4 mr-1" /> ডাউনলোড
                      </a>
                    </>
                  )}
                  {p.source_url && (
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center text-xs px-2 py-1 text-meta hover:text-primary"
                    >
                      সোর্স <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <Button onClick={() => loadPage(page + 1)} disabled={loading} variant="outline">
              {loading ? "লোড হচ্ছে..." : "আরও দেখুন"}
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
