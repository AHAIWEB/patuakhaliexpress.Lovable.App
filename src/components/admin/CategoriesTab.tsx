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
import { Trash2, Pencil, Plus, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface RowProps {
  cat: Cat;
  onEdit: (c: Cat) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, field: "show_in_menu" | "hide_featured", v: boolean) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableRow = ({ cat, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-secondary/40 border border-border">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-1"
        aria-label="ড্র্যাগ"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 font-medium truncate">
        {cat.name} <span className="text-xs text-muted-foreground">/{cat.slug}</span>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <label className="text-xs flex items-center gap-1">
          মেনু <Switch checked={cat.show_in_menu} onCheckedChange={(v) => onToggle(cat.id, "show_in_menu", v)} />
        </label>
        <label className="text-xs flex items-center gap-1">
          হাইড <Switch checked={cat.hide_featured} onCheckedChange={(v) => onToggle(cat.id, "hide_featured", v)} />
        </label>
      </div>
      <div className="flex flex-col">
        <Button size="icon" variant="ghost" className="h-5 w-6" disabled={isFirst} onClick={() => onMoveUp(cat.id)}>
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-5 w-6" disabled={isLast} onClick={() => onMoveDown(cat.id)}>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Button size="icon" variant="ghost" onClick={() => onEdit(cat)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onDelete(cat.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export default function CategoriesTab() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    const patch = field === "show_in_menu" ? { show_in_menu: v } : { hide_featured: v };
    await supabase.from("categories").update(patch).eq("id", id);
    load();
  };

  /** Persist new ordering for a sibling group */
  const persistOrder = async (ordered: Cat[]) => {
    // Optimistic UI: rebuild full list with new orders for these IDs
    const orderMap = new Map(ordered.map((c, i) => [c.id, i * 10]));
    setCats((prev) =>
      prev
        .map((c) => (orderMap.has(c.id) ? { ...c, display_order: orderMap.get(c.id)! } : c))
        .sort((a, b) => a.display_order - b.display_order)
    );
    await Promise.all(
      ordered.map((c, i) =>
        supabase.from("categories").update({ display_order: i * 10 }).eq("id", c.id)
      )
    );
  };

  const handleDragEnd = async (event: DragEndEvent, parent: string | null) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const siblings = cats.filter((c) => c.parent_id === parent);
    const oldIndex = siblings.findIndex((c) => c.id === active.id);
    const newIndex = siblings.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(siblings, oldIndex, newIndex);
    await persistOrder(reordered);
    toast.success("ক্রম পরিবর্তিত");
  };

  const moveBy = async (id: string, parent: string | null, delta: number) => {
    const siblings = cats.filter((c) => c.parent_id === parent);
    const idx = siblings.findIndex((c) => c.id === id);
    const target = idx + delta;
    if (idx === -1 || target < 0 || target >= siblings.length) return;
    const reordered = arrayMove(siblings, idx, target);
    await persistOrder(reordered);
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline text-lg text-headline">তালিকা</h3>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            ড্র্যাগ অথবা ↑↓ বাটন দিয়ে মেনুর ক্রম পরিবর্তন করুন
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e, null)}
        >
          <SortableContext items={top.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {top.map((c, i) => (
                <div key={c.id}>
                  <SortableRow
                    cat={c}
                    onEdit={startEdit}
                    onDelete={del}
                    onToggle={toggle}
                    onMoveUp={(id) => moveBy(id, null, -1)}
                    onMoveDown={(id) => moveBy(id, null, 1)}
                    isFirst={i === 0}
                    isLast={i === top.length - 1}
                  />
                  {childrenOf(c.id).length > 0 && (
                    <div className="ml-6 border-l-2 border-primary/30 pl-3 my-1">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, c.id)}
                      >
                        <SortableContext
                          items={childrenOf(c.id).map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5">
                            {childrenOf(c.id).map((s, si) => (
                              <SortableRow
                                key={s.id}
                                cat={s}
                                onEdit={startEdit}
                                onDelete={del}
                                onToggle={toggle}
                                onMoveUp={(id) => moveBy(id, c.id, -1)}
                                onMoveDown={(id) => moveBy(id, c.id, 1)}
                                isFirst={si === 0}
                                isLast={si === childrenOf(c.id).length - 1}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  );
}
