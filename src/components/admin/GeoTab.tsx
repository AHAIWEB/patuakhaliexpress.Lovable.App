import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Division { id: string; bn_name: string; name: string; slug: string; }
interface District { id: string; bn_name: string; name: string; slug: string; division_id: string; }
interface Upazila { id: string; bn_name: string; name: string; slug: string; district_id: string; }

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);

export default function GeoTab() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [selectedDiv, setSelectedDiv] = useState<string>("");
  const [selectedDist, setSelectedDist] = useState<string>("");

  // New entry inputs
  const [newBn, setNewBn] = useState("");
  const [newEn, setNewEn] = useState("");
  const [tab, setTab] = useState<"division" | "district" | "upazila">("division");

  const load = async () => {
    const [{ data: dv }, { data: ds }, { data: up }] = await Promise.all([
      supabase.from("divisions").select("id,bn_name,name,slug").order("display_order"),
      supabase.from("districts").select("id,bn_name,name,slug,division_id").order("display_order"),
      supabase.from("upazilas").select("id,bn_name,name,slug,district_id").order("display_order"),
    ]);
    setDivisions(dv ?? []);
    setDistricts(ds ?? []);
    setUpazilas(up ?? []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newBn.trim() || !newEn.trim()) return toast.error("বাংলা ও ইংরেজি নাম দিন");
    const slug = slugify(newEn);
    if (tab === "division") {
      await supabase.from("divisions").insert({ bn_name: newBn, name: newEn, slug });
    } else if (tab === "district") {
      if (!selectedDiv) return toast.error("বিভাগ বাছুন");
      await supabase.from("districts").insert({ bn_name: newBn, name: newEn, slug, division_id: selectedDiv });
    } else {
      if (!selectedDist) return toast.error("জেলা বাছুন");
      await supabase.from("upazilas").insert({ bn_name: newBn, name: newEn, slug, district_id: selectedDist });
    }
    toast.success("যোগ হয়েছে");
    setNewBn(""); setNewEn("");
    load();
  };

  const del = async (table: "divisions" | "districts" | "upazilas", id: string) => {
    if (!confirm("মুছবেন? এর সাথে সম্পর্কিত সব মুছে যাবে।")) return;
    await supabase.from(table).delete().eq("id", id);
    load();
  };

  const filteredDistricts = selectedDiv ? districts.filter((d) => d.division_id === selectedDiv) : districts;
  const filteredUpazilas = selectedDist ? upazilas.filter((u) => u.district_id === selectedDist) : upazilas;

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border p-5 space-y-3">
        <h3 className="font-headline text-lg text-headline">নতুন এন্ট্রি</h3>
        <div className="flex gap-2">
          {(["division", "district", "upazila"] as const).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
              {t === "division" ? "বিভাগ" : t === "district" ? "জেলা" : "উপজেলা"}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>বাংলা নাম</Label><Input value={newBn} onChange={(e) => setNewBn(e.target.value)} /></div>
          <div><Label>ইংরেজি নাম (slug)</Label><Input value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="e.g. patuakhali" /></div>
          {tab !== "division" && (
            <div>
              <Label>বিভাগ</Label>
              <Select value={selectedDiv} onValueChange={setSelectedDiv}>
                <SelectTrigger><SelectValue placeholder="বাছুন" /></SelectTrigger>
                <SelectContent>{divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.bn_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {tab === "upazila" && (
            <div>
              <Label>জেলা</Label>
              <Select value={selectedDist} onValueChange={setSelectedDist}>
                <SelectTrigger><SelectValue placeholder="বাছুন" /></SelectTrigger>
                <SelectContent>{filteredDistricts.map((d) => <SelectItem key={d.id} value={d.id}>{d.bn_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button onClick={add}>যোগ</Button>
      </section>

      <section className="bg-card border border-border p-5 space-y-4">
        <h3 className="font-headline text-lg text-headline">ব্রাউজ</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-xs text-muted-foreground">বিভাগ ({divisions.length})</Label>
            <div className="mt-1 max-h-72 overflow-y-auto border border-border">
              {divisions.map((d) => (
                <div key={d.id} className={`flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer ${selectedDiv === d.id ? "bg-primary/10" : "hover:bg-secondary/50"}`} onClick={() => { setSelectedDiv(d.id); setSelectedDist(""); }}>
                  <span>{d.bn_name}</span>
                  <Trash2 className="h-3 w-3 text-destructive" onClick={(e) => { e.stopPropagation(); del("divisions", d.id); }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">জেলা ({filteredDistricts.length})</Label>
            <div className="mt-1 max-h-72 overflow-y-auto border border-border">
              {filteredDistricts.map((d) => (
                <div key={d.id} className={`flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer ${selectedDist === d.id ? "bg-primary/10" : "hover:bg-secondary/50"}`} onClick={() => setSelectedDist(d.id)}>
                  <span>{d.bn_name}</span>
                  <Trash2 className="h-3 w-3 text-destructive" onClick={(e) => { e.stopPropagation(); del("districts", d.id); }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">উপজেলা ({filteredUpazilas.length})</Label>
            <div className="mt-1 max-h-72 overflow-y-auto border border-border">
              {filteredUpazilas.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-2 py-1.5 text-sm hover:bg-secondary/50">
                  <span>{u.bn_name}</span>
                  <Trash2 className="h-3 w-3 text-destructive cursor-pointer" onClick={() => del("upazilas", u.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
