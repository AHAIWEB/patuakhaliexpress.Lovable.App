import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, ExternalLink, Facebook, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { User } from "@supabase/supabase-js";

interface Photocard {
  id: string;
  image_url: string | null;
  quote: string | null;
  source_url: string | null;
  created_at: string;
  created_by: string | null;
  category_id: string | null;
}

interface PhotoPost {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  source_url: string | null;
  source: { name: string } | null;
  published_at: string;
}

interface Source {
  id: string;
  name: string;
  base_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

const PAGE = 18;

const Gallery = () => {
  const [tab, setTab] = useState<"photocards" | "photos">("photocards");

  // Photocards state
  const [items, setItems] = useState<Photocard[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const reqId = useRef(0);

  // Photo posts state
  const [photos, setPhotos] = useState<PhotoPost[]>([]);
  const [photoPage, setPhotoPage] = useState(0);
  const [photoHasMore, setPhotoHasMore] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    document.title = "ফটোকার্ড ও গ্যালারি — পটুয়াখালী এক্সপ্রেস";
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user ?? null)
    );
    supabase
      .from("sources")
      .select("id,name,base_url")
      .order("name")
      .then(({ data }) => setSources((data as Source[]) ?? []));
    supabase
      .from("categories")
      .select("id,name")
      .order("display_order")
      .then(({ data }) => setCategories((data as Category[]) ?? []));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === sourceFilter) ?? null,
    [sources, sourceFilter]
  );

  useEffect(() => {
    if (tab !== "photocards") return;
    setItems([]);
    setPage(0);
    setHasMore(true);
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sourceFilter, categoryFilter, tab]);

  useEffect(() => {
    if (tab !== "photos") return;
    setPhotos([]);
    setPhotoPage(0);
    setPhotoHasMore(true);
    loadPhotos(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadPage = async (p: number, reset = false) => {
    setLoading(true);
    const myReq = ++reqId.current;
    const from = p * PAGE;
    const to = from + PAGE - 1;
    let query = supabase
      .from("photocards")
      .select("id,image_url,quote,source_url,created_at,created_by,category_id")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) query = query.ilike("quote", `%${search}%`);
    if (selectedSource?.base_url) {
      query = query.ilike("source_url", `%${selectedSource.base_url}%`);
    }
    if (categoryFilter !== "all") {
      query = query.eq("category_id", categoryFilter);
    }

    const { data } = await query;
    if (myReq !== reqId.current) return;
    const arr = (data as Photocard[]) ?? [];
    setItems((prev) => (reset || p === 0 ? arr : [...prev, ...arr]));
    setHasMore(arr.length === PAGE);
    setPage(p);
    setLoading(false);
  };

  const loadPhotos = async (p: number, reset = false) => {
    setPhotoLoading(true);
    const from = p * PAGE;
    const to = from + PAGE - 1;
    // Get photo-gallery category id
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "photo-gallery")
      .maybeSingle();
    if (!cat) {
      setPhotoLoading(false);
      setPhotoHasMore(false);
      return;
    }
    const { data } = await supabase
      .from("posts")
      .select("id,title,slug,image_url,source_url,published_at,source:sources(name)")
      .eq("is_published", true)
      .eq("category_id", cat.id)
      .not("image_url", "is", null)
      .order("published_at", { ascending: false })
      .range(from, to);
    const arr = (data as PhotoPost[]) ?? [];
    setPhotos((prev) => (reset || p === 0 ? arr : [...prev, ...arr]));
    setPhotoHasMore(arr.length === PAGE);
    setPhotoPage(p);
    setPhotoLoading(false);
  };

  const sentinelRef = useInfiniteScroll(() => loadPage(page + 1), {
    hasMore: hasMore && tab === "photocards",
    loading,
  });
  const photoSentinelRef = useInfiniteScroll(() => loadPhotos(photoPage + 1), {
    hasMore: photoHasMore && tab === "photos",
    loading: photoLoading,
  });

  const shareFb = (img: string) => {
    const url = encodeURIComponent(img);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500"
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ফটোকার্ডটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("photocards").delete().eq("id", id);
    if (error) {
      toast({ title: "মুছে ফেলা যায়নি", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "ডিলিট হয়েছে" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-headline border-b-2 border-primary pb-2 mb-4">
          গ্যালারি
        </h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="photocards">🎴 ফটোকার্ড</TabsTrigger>
            <TabsTrigger value="photos">📸 ছবি গ্যালারি</TabsTrigger>
          </TabsList>

          <TabsContent value="photocards">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="কোট দিয়ে সার্চ করুন..."
                  className="pl-9"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="sm:w-44"><SelectValue placeholder="সব সোর্স" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব সোর্স</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-44"><SelectValue placeholder="সব ক্যাটাগরি" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {items.length === 0 && !loading ? (
              <p className="text-muted-foreground">কোনো ফটোকার্ড পাওয়া যায়নি।</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => {
                  const isOwner = !!user && p.created_by === user.id;
                  return (
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
                            <a href={p.image_url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs px-2 py-1 hover:text-primary">
                              <Download className="h-4 w-4 mr-1" /> ডাউনলোড
                            </a>
                          </>
                        )}
                        {p.source_url && (
                          <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center text-xs px-2 py-1 text-meta hover:text-primary">
                            সোর্স <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                        {isOwner && (
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className={p.source_url ? "" : "ml-auto"} title="ডিলিট">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div ref={sentinelRef} className="h-10 mt-6" />
            {loading && <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>}
          </TabsContent>

          <TabsContent value="photos">
            {photos.length === 0 && !photoLoading ? (
              <p className="text-muted-foreground">এখনো কোনো ফটো গ্যালারি পোস্ট নেই।</p>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((p) => (
                  <Link
                    key={p.id}
                    to={`/post/${p.slug}`}
                    className="group block bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {p.image_url && (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-2">
                      <h3 className="font-headline text-sm text-headline line-clamp-2 leading-snug">
                        {p.title}
                      </h3>
                      {p.source?.name && (
                        <p className="text-[10px] text-meta mt-1">{p.source.name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div ref={photoSentinelRef} className="h-10 mt-6" />
            {photoLoading && <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
