import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";

interface Source {
  id: string;
  name: string;
  base_url: string | null;
  logo_url: string | null;
}

export default function SourcesTab() {
  const [sources, setSources] = useState<Source[]>([]);
  const [name, setName] = useState("");
  const [base, setBase] = useState("");
  const [logo, setLogo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("sources")
      .select("id,name,base_url,logo_url")
      .order("name");
    setSources(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!name.trim()) return toast.error("নাম দিন");
    const payload = { name: name.trim(), base_url: base || null, logo_url: logo || null };
    if (editingId) {
      await supabase.from("sources").update(payload).eq("id", editingId);
    } else {
      await supabase.from("sources").insert(payload);
    }
    toast.success("সেভ হয়েছে");
    setName(""); setBase(""); setLogo(""); setEditingId(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("মুছবেন?")) return;
    await supabase.from("sources").delete().eq("id", id);
    load();
  };

  const startEdit = (s: Source) => {
    setEditingId(s.id);
    setName(s.name);
    setBase(s.base_url ?? "");
    setLogo(s.logo_url ?? "");
  };

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border p-5 space-y-3">
        <h3 className="font-headline text-lg text-headline">
          {editingId ? "সোর্স সম্পাদনা" : "নতুন সোর্স"}
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div><Label>নাম</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Base URL</Label><Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://..." /></div>
          <div><Label>Logo URL</Label><Input value={logo} onChange={(e) => setLogo(e.target.value)} /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>{editingId ? "আপডেট" : "যোগ"}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setName(""); setBase(""); setLogo(""); }}>বাতিল</Button>}
        </div>
      </section>

      <section className="bg-card border border-border p-5">
        <h3 className="font-headline text-lg text-headline mb-3">তালিকা ({sources.length})</h3>
        <div className="space-y-2">
          {sources.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-2 bg-secondary/40 border border-border">
              <div className="flex-1">
                <div className="font-medium">{s.name}</div>
                {s.base_url && <div className="text-xs text-muted-foreground">{s.base_url}</div>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
