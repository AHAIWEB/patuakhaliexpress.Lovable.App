import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Search, Star, Eye, EyeOff, Pencil, CheckSquare, Square } from "lucide-react";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  is_featured: boolean;
  post_type: "auto" | "manual";
  published_at: string;
  category: { name: string } | null;
  source: { name: string } | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category_id: string | null;
}

interface Cat { id: string; name: string; }

export default function PostsTab() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    let query = supabase
      .from("posts")
      .select("id,title,slug,is_published,is_featured,post_type,published_at,excerpt,content,image_url,category_id,category:categories(name),source:sources(name)")
      .order("published_at", { ascending: false })
      .limit(200);
    if (filterCat !== "all") query = query.eq("category_id", filterCat);
    if (filterType !== "all") query = query.eq("post_type", filterType as "auto" | "manual");
    if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
    const { data } = await query;
    setPosts((data as PostRow[]) ?? []);
    setSelected(new Set());
  };

  useEffect(() => {
    supabase.from("categories").select("id,name").order("display_order").then(({ data }) => setCats(data ?? []));
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filterCat, filterType]);

  const togglePublish = async (p: PostRow) => {
    await supabase.from("posts").update({ is_published: !p.is_published }).eq("id", p.id);
    load();
  };
  const toggleFeatured = async (p: PostRow) => {
    await supabase.from("posts").update({ is_featured: !p.is_featured }).eq("id", p.id);
    load();
  };
  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("posts").delete().eq("id", id);
    toast.success("মুছে ফেলা হয়েছে");
    load();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === posts.length) setSelected(new Set());
    else setSelected(new Set(posts.map((p) => p.id)));
  };

  const bulkAction = async (
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return toast.error("কোনো পোস্ট সিলেক্ট করা নেই");
    if (action === "delete" && !confirm(`${ids.length}টি পোস্ট মুছবেন?`)) return;

    let res;
    if (action === "delete") {
      res = await supabase.from("posts").delete().in("id", ids);
    } else {
      const patch: Record<string, boolean> =
        action === "publish" ? { is_published: true }
        : action === "unpublish" ? { is_published: false }
        : action === "feature" ? { is_featured: true }
        : { is_featured: false };
      res = await supabase.from("posts").update(patch).in("id", ids);
    }
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`${ids.length}টি পোস্টে অপারেশন সম্পন্ন`);
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase
      .from("posts")
      .update({
        title: editing.title,
        excerpt: editing.excerpt,
        content: editing.content,
        image_url: editing.image_url,
        category_id: editing.category_id,
      })
      .eq("id", editing.id);
    toast.success("সেভ হয়েছে");
    setEditing(null);
    load();
  };

  const allSelected = selected.size === posts.length && posts.length > 0;

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border p-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label>সার্চ</Label>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="শিরোনাম দিয়ে খুঁজুন" onKeyDown={(e) => e.key === "Enter" && load()} />
            <Button onClick={load}><Search className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <Label>ক্যাটাগরি</Label>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>ধরন</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব</SelectItem>
              <SelectItem value="auto">অটো</SelectItem>
              <SelectItem value="manual">ম্যানুয়াল</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {selected.size > 0 && (
        <section className="bg-primary/10 border-2 border-primary p-3 flex flex-wrap items-center gap-2 sticky top-0 z-10">
          <span className="text-sm font-medium mr-2">{selected.size}টি সিলেক্টেড</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction("publish")}>
            <Eye className="h-4 w-4 mr-1" /> Publish
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("unpublish")}>
            <EyeOff className="h-4 w-4 mr-1" /> Unpublish
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("feature")}>
            <Star className="h-4 w-4 mr-1" /> Featured
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("unfeature")}>
            <Star className="h-4 w-4 mr-1" /> Unfeatured
          </Button>
          <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>
            <Trash2 className="h-4 w-4 mr-1" /> ডিলিট
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto">
            বাতিল
          </Button>
        </section>
      )}

      <section className="bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">{posts.length}টি পোস্ট</div>
          <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
            {allSelected ? <CheckSquare className="h-4 w-4 mr-1" /> : <Square className="h-4 w-4 mr-1" />}
            সব সিলেক্ট
          </Button>
        </div>
        <div className="space-y-2">
          {posts.map((p) => (
            <div
              key={p.id}
              className={`flex items-start gap-2 p-2 border bg-secondary/30 ${
                selected.has(p.id) ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Checkbox
                checked={selected.has(p.id)}
                onCheckedChange={() => toggleSelect(p.id)}
                className="mt-2"
              />
              {p.image_url && <img src={p.image_url} alt="" className="w-16 h-12 object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {p.category?.name ?? "—"} • {p.source?.name ?? "ম্যানুয়াল"} • {p.post_type}
                  {!p.is_published && " • অপ্রকাশিত"}
                  {p.is_featured && " • ⭐"}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => toggleFeatured(p)} title="ফিচার্ড">
                <Star className={`h-4 w-4 ${p.is_featured ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => togglePublish(p)} title={p.is_published ? "Unpublish" : "Publish"}>
                {p.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => del(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm text-muted-foreground">কোনো পোস্ট নেই।</p>}
        </div>
      </section>

      {editing && (
        <section className="bg-card border-2 border-primary p-5 space-y-3">
          <h3 className="font-headline text-lg text-headline">পোস্ট সম্পাদনা</h3>
          <div><Label>শিরোনাম</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div>
            <Label>ক্যাটাগরি</Label>
            <Select value={editing.category_id ?? ""} onValueChange={(v) => setEditing({ ...editing, category_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>ইমেজ URL</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
          <div><Label>সারাংশ</Label><textarea className="w-full border border-input rounded px-3 py-2 text-sm" rows={2} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
          <div><Label>কন্টেন্ট</Label><textarea className="w-full border border-input rounded px-3 py-2 text-sm" rows={8} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button onClick={saveEdit}>সেভ</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
          </div>
        </section>
      )}
    </div>
  );
}
