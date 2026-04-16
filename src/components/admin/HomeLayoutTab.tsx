import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";

interface Section {
  id: string;
  title: string;
  section_type: string;
  category_id: string | null;
  division_id: string | null;
  variant: string;
  item_count: number;
  display_order: number;
  is_visible: boolean;
}

interface Cat { id: string; name: string; }
interface Div { id: string; bn_name: string; }

export default function HomeLayoutTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [divs, setDivs] = useState<Div[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"category" | "division" | "latest">("category");
  const [refId, setRefId] = useState("");
  const [variant, setVariant] = useState("grid");
  const [count, setCount] = useState(6);

  const load = async () => {
    const [{ data: secs }, { data: c }, { data: d }] = await Promise.all([
      supabase.from("home_sections").select("*").order("display_order"),
      supabase.from("categories").select("id,name").order("display_order"),
      supabase.from("divisions").select("id,bn_name").order("display_order"),
    ]);
    setSections((secs as Section[]) ?? []);
    setCats(c ?? []);
    setDivs(d ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim()) return toast.error("টাইটেল দিন");
    const order = sections.length ? Math.max(...sections.map((s) => s.display_order)) + 10 : 10;
    await supabase.from("home_sections").insert({
      title: title.trim(),
      section_type: type,
      category_id: type === "category" ? refId : null,
      division_id: type === "division" ? refId : null,
      variant,
      item_count: count,
      display_order: order,
    });
    setTitle(""); setRefId("");
    toast.success("যোগ হয়েছে");
    load();
  };

  const update = async (id: string, patch: Partial<Section>) => {
    await supabase.from("home_sections").update(patch).eq("id", id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("home_sections").delete().eq("id", id);
    load();
  };

  const move = async (s: Section, dir: -1 | 1) => {
    await update(s.id, { display_order: s.display_order + dir * 5 });
  };

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border p-5 space-y-3">
        <h3 className="font-headline text-lg text-headline">নতুন সেকশন</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>টাইটেল</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div>
            <Label>ধরন</Label>
            <Select value={type} onValueChange={(v) => { setType(v as typeof type); setRefId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="category">ক্যাটাগরি</SelectItem>
                <SelectItem value="division">বিভাগ (geo)</SelectItem>
                <SelectItem value="latest">সর্বশেষ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type !== "latest" && (
            <div>
              <Label>{type === "category" ? "ক্যাটাগরি" : "বিভাগ"}</Label>
              <Select value={refId} onValueChange={setRefId}>
                <SelectTrigger><SelectValue placeholder="বাছুন" /></SelectTrigger>
                <SelectContent>
                  {(type === "category" ? cats.map((c) => ({ id: c.id, name: c.name })) : divs.map((d) => ({ id: d.id, name: d.bn_name }))).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>লেআউট</Label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">গ্রিড</SelectItem>
                <SelectItem value="list">তালিকা</SelectItem>
                <SelectItem value="hero">হিরো</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>আইটেম সংখ্যা</Label>
            <Input type="number" min={1} max={12} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> যোগ করুন</Button>
      </section>

      <section className="bg-card border border-border p-5">
        <h3 className="font-headline text-lg text-headline mb-3">হোমপেজ সেকশন ({sections.length})</h3>
        <div className="space-y-2">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-3 bg-secondary/40 border border-border">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(s, -1)}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(s, 1)}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground">
                  {s.section_type} • {s.variant} • {s.item_count}টি • order {s.display_order}
                </div>
              </div>
              <Select value={s.variant} onValueChange={(v) => update(s.id, { variant: v })}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">গ্রিড</SelectItem>
                  <SelectItem value="list">তালিকা</SelectItem>
                  <SelectItem value="hero">হিরো</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={12} value={s.item_count} onChange={(e) => update(s.id, { item_count: Number(e.target.value) })} className="w-16 h-8 text-xs" />
              <Switch checked={s.is_visible} onCheckedChange={(v) => update(s.id, { is_visible: v })} />
              <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          {sections.length === 0 && <p className="text-sm text-muted-foreground">কোনো সেকশন নেই।</p>}
        </div>
      </section>
    </div>
  );
}
