import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

interface Cat {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  show_in_menu: boolean;
  hide_featured: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u0980-\u09FF]/g, "")
    .slice(0, 80) || `cat-${Date.now().toString(36)}`;

export default function CategoriesTab() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id,name,slug,parent_id,display_order,show_in_menu,hide_featured")
      .order("display_order");
    setCats(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!name.trim()) return toast.error("নাম দিন");
    const payload = {
      name: name.trim(),
      slug: slugify(name),
      parent_id: parentId === "none" ? null : parentId,
    };
    if (editingId) {
      await supabase.from("categories").update(payload).eq("id", editingId);
      toast.success("আপডেট হয়েছে");
    } else {
      await supabase.from("categories").insert(payload);
      toast.success("যোগ হয়েছে");
    }
    setName("");
    setParentId("none");
    setEditingId(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("মুছে ফেলা হয়েছে");
    load();
  };

  const startEdit = (c: Cat) => {
    setEditingId(c.id);
    setName(c.name);
    setParentId(c.parent_id ?? "none");
  };

  const toggle = async (id: string, field: "show_in_menu" | "hide_featured", v: boolean) => {
    await supabase.from("categories").update({ [field]: v }).eq("id", id);
    load();
  };

  const top = cats.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => cats.filter((c) => c.parent_id === id);

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border p-5 space-y-3">
        <h3 className="font-headline text-lg text-headline">
          {editingId ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>নাম</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>প্যারেন্ট (সাব-ক্যাটাগরি হলে)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— শীর্ষ —</SelectItem>
                {top.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>
            <Plus className="h-4 w-4 mr-1" />
            {editingId ? "আপডেট" : "যোগ"}
          </Button>
          {editingId && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setName("");
                setParentId("none");
              }}
            >
              বাতিল
            </Button>
          )}
        </div>
      </section>

      <section className="bg-card border border-border p-5">
        <h3 className="font-headline text-lg text-headline mb-3">তালিকা</h3>
        <div className="space-y-2">
          {top.map((c) => (
            <div key={c.id}>
              <div className="flex items-center gap-2 p-2 bg-secondary/40 border border-border">
                <div className="flex-1 font-medium">{c.name} <span className="text-xs text-muted-foreground">/{c.slug}</span></div>
                <label className="text-xs flex items-center gap-1">
                  মেনু <Switch checked={c.show_in_menu} onCheckedChange={(v) => toggle(c.id, "show_in_menu", v)} />
                </label>
                <label className="text-xs flex items-center gap-1">
                  হাইড <Switch checked={c.hide_featured} onCheckedChange={(v) => toggle(c.id, "hide_featured", v)} />
                </label>
                <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {childrenOf(c.id).map((s) => (
                <div key={s.id} className="ml-6 flex items-center gap-2 p-2 border-l-2 border-primary/40 pl-3 my-1">
                  <div className="flex-1 text-sm">↳ {s.name} <span className="text-xs text-muted-foreground">/{s.slug}</span></div>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
