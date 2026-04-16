import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Play, RefreshCw } from "lucide-react";

interface Cat {
  id: string;
  name: string;
  slug: string;
}
interface Source {
  id: string;
  name: string;
}
interface ScraperConfig {
  id: string;
  url: string;
  method: "rss" | "firecrawl";
  interval_minutes: number;
  is_active: boolean;
  last_run_at: string | null;
  last_error: string | null;
  source: { name: string } | null;
  category: { name: string } | null;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u0980-\u09FF]/g, "")
    .slice(0, 80) || `post-${Date.now()}`;

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [scrapers, setScrapers] = useState<ScraperConfig[]>([]);
  const [running, setRunning] = useState(false);

  // New manual post
  const [pTitle, setPTitle] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pExcerpt, setPExcerpt] = useState("");
  const [pContent, setPContent] = useState("");
  const [pImage, setPImage] = useState("");
  const [pFeatured, setPFeatured] = useState(false);

  // New scraper config
  const [sUrl, setSUrl] = useState("");
  const [sMethod, setSMethod] = useState<"rss" | "firecrawl">("firecrawl");
  const [sInterval, setSInterval] = useState(5);
  const [sCategory, setSCategory] = useState("");
  const [sSource, setSSource] = useState("");

  useEffect(() => {
    document.title = "এডমিন প্যানেল — পটুয়াখালী এক্সপ্রেস";
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }
      setUserId(data.session.user.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      if (admin) await loadAll();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadAll = async () => {
    const [cats, srcs, scs] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("display_order"),
      supabase.from("sources").select("id,name").order("name"),
      supabase
        .from("scraper_configs")
        .select(
          "id,url,method,interval_minutes,is_active,last_run_at,last_error,source:sources(name),category:categories(name)"
        )
        .order("created_at", { ascending: false }),
    ]);
    setCategories(cats.data ?? []);
    setSources(srcs.data ?? []);
    setScrapers((scs.data as any) ?? []);
  };

  const makeMeAdmin = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" as const });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("admin বানানো হয়েছে। পেজ রিলোড করুন।");
    setTimeout(() => location.reload(), 800);
  };

  const createPost = async () => {
    if (!pTitle || !pCategory) {
      toast.error("শিরোনাম ও ক্যাটাগরি প্রয়োজন");
      return;
    }
    const { error } = await supabase.from("posts").insert({
      title: pTitle,
      slug: `${slugify(pTitle)}-${Date.now().toString(36)}`,
      excerpt: pExcerpt || null,
      content: pContent || null,
      image_url: pImage || null,
      category_id: pCategory,
      post_type: "manual" as const,
      is_featured: pFeatured,
      created_by: userId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("পোস্ট তৈরি হয়েছে");
    setPTitle("");
    setPExcerpt("");
    setPContent("");
    setPImage("");
    setPFeatured(false);
  };

  const createScraper = async () => {
    if (!sUrl || !sCategory || !sSource) {
      toast.error("URL, সোর্স ও ক্যাটাগরি প্রয়োজন");
      return;
    }
    const { error } = await supabase.from("scraper_configs").insert({
      url: sUrl,
      method: sMethod,
      interval_minutes: sInterval,
      category_id: sCategory,
      source_id: sSource,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("স্ক্রেপার যুক্ত হয়েছে");
    setSUrl("");
    await loadAll();
  };

  const deleteScraper = async (id: string) => {
    await supabase.from("scraper_configs").delete().eq("id", id);
    await loadAll();
  };

  const runScrapers = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-scrapers", {
        body: {},
      });
      if (error) throw error;
      toast.success(
        `স্ক্রেপার চালু — ${data?.processed ?? 0}টি কনফিগ, ${data?.inserted ?? 0}টি নতুন পোস্ট`
      );
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || "ত্রুটি");
    } finally {
      setRunning(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container-news py-10 text-muted-foreground">লোড হচ্ছে...</main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container-news py-10">
          <div className="max-w-md mx-auto bg-card border border-border p-6">
            <h1 className="font-headline text-xl text-headline mb-2">এডমিন অ্যাক্সেস নেই</h1>
            <p className="text-sm text-muted-foreground mb-4">
              আপনি লগইন করেছেন কিন্তু admin role নেই। প্রথম admin বানাতে নিচের বাটন ক্লিক করুন
              (শুধু প্রথম ব্যবহারকারীর জন্য)।
            </p>
            <Button onClick={makeMeAdmin} className="w-full">
              আমাকে admin বানান
            </Button>
            <Button onClick={logout} variant="outline" className="w-full mt-2">
              লগআউট
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-headline text-2xl sm:text-3xl text-headline">এডমিন প্যানেল</h1>
          <Button onClick={logout} variant="outline" size="sm">
            লগআউট
          </Button>
        </div>

        <Tabs defaultValue="scrapers">
          <TabsList>
            <TabsTrigger value="scrapers">স্ক্রেপার</TabsTrigger>
            <TabsTrigger value="post">ম্যানুয়াল পোস্ট</TabsTrigger>
            <TabsTrigger value="photocard">ফটোকার্ড</TabsTrigger>
          </TabsList>

          {/* Scrapers */}
          <TabsContent value="scrapers" className="space-y-6">
            <section className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-lg text-headline">স্ক্রেপার চালান</h2>
                <Button onClick={runScrapers} disabled={running}>
                  {running ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  সব স্ক্রেপার চালান
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                প্রতি মিনিটে অটো চালু হয়। ম্যানুয়ালিও চালাতে পারেন।
              </p>
            </section>

            <section className="bg-card border border-border p-5">
              <h2 className="font-headline text-lg text-headline mb-4">নতুন স্ক্রেপার যুক্ত করুন</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>URL (ক্যাটাগরি/RSS লিংক)</Label>
                  <Input
                    placeholder="https://www.jugantor.com/national"
                    value={sUrl}
                    onChange={(e) => setSUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>সোর্স</Label>
                  <Select value={sSource} onValueChange={setSSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="সোর্স বাছুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ক্যাটাগরি</Label>
                  <Select value={sCategory} onValueChange={setSCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="ক্যাটাগরি বাছুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>পদ্ধতি</Label>
                  <Select value={sMethod} onValueChange={(v) => setSMethod(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="firecrawl">Firecrawl (যেকোনো URL)</SelectItem>
                      <SelectItem value="rss">RSS (RSS feed হলে)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ইন্টারভাল (মিনিট)</Label>
                  <Select
                    value={String(sInterval)}
                    onValueChange={(v) => setSInterval(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">১ মিনিট</SelectItem>
                      <SelectItem value="5">৫ মিনিট</SelectItem>
                      <SelectItem value="15">১৫ মিনিট</SelectItem>
                      <SelectItem value="60">১ ঘণ্টা</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createScraper} className="mt-4">
                যুক্ত করুন
              </Button>
            </section>

            <section className="bg-card border border-border p-5">
              <h2 className="font-headline text-lg text-headline mb-4">
                স্ক্রেপার তালিকা ({scrapers.length})
              </h2>
              <div className="space-y-2">
                {scrapers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-3 border border-border bg-secondary/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.url}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.source?.name} → {s.category?.name} • {s.method} • প্রতি{" "}
                        {s.interval_minutes} মিনিট
                        {s.last_run_at && (
                          <> • সর্বশেষ: {new Date(s.last_run_at).toLocaleString("bn-BD")}</>
                        )}
                      </div>
                      {s.last_error && (
                        <div className="text-xs text-destructive mt-1 truncate">
                          {s.last_error}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteScraper(s.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {scrapers.length === 0 && (
                  <p className="text-sm text-muted-foreground">কোনো স্ক্রেপার যুক্ত করা হয়নি।</p>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Manual post */}
          <TabsContent value="post">
            <section className="bg-card border border-border p-5 space-y-4">
              <h2 className="font-headline text-lg text-headline">নতুন পোস্ট</h2>
              <div>
                <Label>শিরোনাম</Label>
                <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
              </div>
              <div>
                <Label>ক্যাটাগরি</Label>
                <Select value={pCategory} onValueChange={setPCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="ক্যাটাগরি" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>সারাংশ</Label>
                <Textarea
                  value={pExcerpt}
                  onChange={(e) => setPExcerpt(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>কন্টেন্ট</Label>
                <Textarea
                  value={pContent}
                  onChange={(e) => setPContent(e.target.value)}
                  rows={8}
                />
              </div>
              <div>
                <Label>ইমেজ URL</Label>
                <Input value={pImage} onChange={(e) => setPImage(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                />
                ফিচার্ড পোস্ট
              </label>
              <Button onClick={createPost}>প্রকাশ করুন</Button>
            </section>
          </TabsContent>

          <TabsContent value="photocard">
            <section className="bg-card border border-border p-5">
              <p className="text-sm">
                ফটোকার্ড জেনারেটর{" "}
                <a href="/photocard" className="text-primary hover:underline">
                  /photocard
                </a>{" "}
                পেজে যান।
              </p>
            </section>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
