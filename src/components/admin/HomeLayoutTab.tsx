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
import { Trash2, Plus, GripVertical, Eye, EyeOff, Settings2 } from "lucide-react";
import HomeLayoutPreview from "./HomeLayoutPreview";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionConfig {
  bg_style?: "none" | "muted" | "accent-tint" | "primary-tint" | "dark";
  tab_category_ids?: string[];
}

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
  config: SectionConfig;
}

interface Cat { id: string; name: string; }
interface Div { id: string; bn_name: string; }

const VARIANTS = [
  { value: "grid", label: "গ্রিড" },
  { value: "list", label: "তালিকা" },
  { value: "hero", label: "হিরো" },
  { value: "web-story", label: "ওয়েব স্টোরি" },
  { value: "opinion", label: "মতামত/উদ্ধৃতি" },
  { value: "mosaic", label: "মোজাইক ১+৪" },
  { value: "large-feature", label: "বড় ফিচার" },
  { value: "numbered-list", label: "নম্বরযুক্ত তালিকা ১-১০" },
  { value: "top-strip", label: "টপ স্ট্রিপ (marquee)" },
  { value: "tabs", label: "ট্যাবস (multi-category)" },
];

const BG_STYLES = [
  { value: "none", label: "ডিফল্ট" },
  { value: "muted", label: "ম্লান ব্যান্ড" },
  { value: "accent-tint", label: "Accent টিন্ট" },
  { value: "primary-tint", label: "Primary টিন্ট" },
  { value: "dark", label: "ডার্ক ব্যান্ড" },
];

function SortableRow({
  s, cats, onUpdate, onDelete,
}: {
  s: Section;
  cats: Cat[];
  onUpdate: (id: string, patch: Partial<Section>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: s.id });
  const [open, setOpen] = useState(false);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = s.config ?? {};
  const tabIds = config.tab_category_ids ?? [];

  const toggleTabCat = (id: string) => {
    const next = tabIds.includes(id)
      ? tabIds.filter((x) => x !== id)
      : [...tabIds, id];
    onUpdate(s.id, { config: { ...config, tab_category_ids: next } });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-secondary/40 border border-border"
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-1 text-muted-foreground hover:text-foreground"
          aria-label="reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{s.title}</div>
          <div className="text-xs text-muted-foreground">
            {s.section_type} • {s.variant} • {s.item_count}টি
            {config.bg_style && config.bg_style !== "none" && ` • bg:${config.bg_style}`}
          </div>
        </div>
        <Select value={s.variant} onValueChange={(v) => onUpdate(s.id, { variant: v })}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VARIANTS.map((v) => (
              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number" min={1} max={12} value={s.item_count}
          onChange={(e) => onUpdate(s.id, { item_count: Number(e.target.value) })}
          className="w-16 h-8 text-xs"
        />
        <Switch checked={s.is_visible} onCheckedChange={(v) => onUpdate(s.id, { is_visible: v })} />
        <Button size="icon" variant="ghost" onClick={() => setOpen((v) => !v)} title="অ্যাডভান্স সেটিং">
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(s.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {open && (
        <div className="border-t border-border p-3 bg-background/50 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ব্যাকগ্রাউন্ড স্টাইল</Label>
              <Select
                value={config.bg_style ?? "none"}
                onValueChange={(v) => onUpdate(s.id, { config: { ...config, bg_style: v as SectionConfig["bg_style"] } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BG_STYLES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {s.variant === "tabs" && (
            <div>
              <Label className="text-xs">ট্যাবগুলোর ক্যাটাগরি (একাধিক বাছুন, ক্রমে যোগ হবে)</Label>
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-border rounded">
                {cats.map((c) => {
                  const active = tabIds.includes(c.id);
                  const order = tabIds.indexOf(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleTabCat(c.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      }`}
                    >
                      {active && <span className="mr-1 opacity-80">{order + 1}.</span>}
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {tabIds.length === 0 && (
                <p className="text-[11px] text-destructive mt-1">কমপক্ষে একটি ক্যাটাগরি বাছুন</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeLayoutTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [divs, setDivs] = useState<Div[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"category" | "division" | "latest">("category");
  const [refId, setRefId] = useState("");
  const [variant, setVariant] = useState("grid");
  const [count, setCount] = useState(6);
  const [showPreview, setShowPreview] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const load = async () => {
    const [{ data: secs }, { data: c }, { data: d }] = await Promise.all([
      supabase.from("home_sections").select("*").order("display_order"),
      supabase.from("categories").select("id,name").order("display_order"),
      supabase.from("divisions").select("id,bn_name").order("display_order"),
    ]);
    setSections(((secs as any[]) ?? []).map((s) => ({ ...s, config: s.config ?? {} })));
    setCats(c ?? []);
    setDivs(d ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim()) return toast.error("টাইটেল দিন");
    const order = sections.length ? Math.max(...sections.map((s) => s.display_order)) + 10 : 10;
    await supabase.from("home_sections").insert({
      title: title.trim(),
      section_type: variant === "tabs" ? "latest" : type,
      category_id: type === "category" && variant !== "tabs" ? refId : null,
      division_id: type === "division" && variant !== "tabs" ? refId : null,
      variant,
      item_count: count,
      display_order: order,
    });
    setTitle(""); setRefId("");
    toast.success("যোগ হয়েছে");
    load();
  };

  const update = async (id: string, patch: Partial<Section>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await supabase.from("home_sections").update(patch as any).eq("id", id);
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("home_sections").delete().eq("id", id);
    load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    const withOrder = reordered.map((s, i) => ({ ...s, display_order: (i + 1) * 10 }));
    setSections(withOrder);
    await Promise.all(
      withOrder.map((s) =>
        supabase.from("home_sections").update({ display_order: s.display_order }).eq("id", s.id)
      )
    );
    toast.success("ক্রম সংরক্ষিত");
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
          {type !== "latest" && variant !== "tabs" && (
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
                {VARIANTS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variant === "tabs" && (
              <p className="text-[11px] text-muted-foreground mt-1">যোগ করার পর ⚙ আইকন থেকে ট্যাবের ক্যাটাগরি বাছুন</p>
            )}
          </div>
          <div>
            <Label>আইটেম সংখ্যা</Label>
            <Input type="number" min={1} max={12} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> যোগ করুন</Button>
      </section>

      <section className="bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-headline text-lg text-headline">হোমপেজ সেকশন ({sections.length})</h3>
            <p className="text-xs text-muted-foreground">⋮⋮ টেনে সাজান • ⚙ ক্লিক করে ব্যাকগ্রাউন্ড/ট্যাব সেট করুন</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <><EyeOff className="h-4 w-4 mr-1" /> প্রিভিউ লুকান</> : <><Eye className="h-4 w-4 mr-1" /> লাইভ প্রিভিউ</>}
          </Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((s) => (
                <SortableRow key={s.id} s={s} cats={cats} onUpdate={update} onDelete={del} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {sections.length === 0 && <p className="text-sm text-muted-foreground">কোনো সেকশন নেই।</p>}
      </section>

      {showPreview && sections.length > 0 && (
        <section className="bg-card border border-border p-5">
          <h3 className="font-headline text-lg text-headline mb-1">লাইভ প্রিভিউ</h3>
          <p className="text-xs text-muted-foreground mb-4">
            পরিবর্তন করার সাথে সাথে এখানে আপডেট হবে
          </p>
          <HomeLayoutPreview sections={sections} />
        </section>
      )}
    </div>
  );
}
