import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { refreshSiteSettings, type SiteSettings } from "@/hooks/useSiteSettings";

const PRESETS = [
  { name: "ক্লাসিক লাল", h: 354, s: 78, l: 46 },
  { name: "নীল সংবাদ", h: 215, s: 80, l: 45 },
  { name: "সবুজ", h: 145, s: 60, l: 38 },
  { name: "বেগুনি", h: 270, s: 60, l: 50 },
  { name: "কমলা", h: 22, s: 88, l: 50 },
  { name: "টিল", h: 180, s: 65, l: 38 },
];

const FONTS = [
  "Noto Serif Bengali",
  "Hind Siliguri",
  "Tiro Bangla",
  "Baloo Da 2",
  "Mina",
];

export default function SiteSettingsTab() {
  const [s, setS] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (data) setS(data);
      setLoading(false);
    })();
  }, []);

  const update = (patch: Partial<SiteSettings>) => setS((p) => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").update(s).eq("id", 1);
    if (error) toast.error(error.message);
    else {
      toast.success("সংরক্ষিত হয়েছে");
      await refreshSiteSettings();
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;

  return (
    <div className="space-y-6">
      {/* Brand identity */}
      <section className="bg-card border border-border p-5 space-y-3">
        <h3 className="font-headline text-lg text-headline">সাইট পরিচিতি</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>সাইটের নাম</Label>
            <Input value={s.site_name ?? ""} onChange={(e) => update({ site_name: e.target.value })} />
          </div>
          <div>
            <Label>OG Image URL</Label>
            <Input value={s.og_image_url ?? ""} onChange={(e) => update({ og_image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <Label>সংক্ষিপ্ত বিবরণ (SEO)</Label>
            <Input value={s.site_description ?? ""} onChange={(e) => update({ site_description: e.target.value })} maxLength={160} />
          </div>
        </div>
      </section>

      {/* Theme color */}
      <section className="bg-card border border-border p-5 space-y-4">
        <h3 className="font-headline text-lg text-headline">থিম রঙ (Primary)</h3>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() =>
                update({ primary_hue: p.h, primary_saturation: p.s, primary_lightness: p.l })
              }
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded text-xs hover:bg-secondary"
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ background: `hsl(${p.h} ${p.s}% ${p.l}%)` }}
              />
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Hue ({s.primary_hue})</Label>
            <Slider value={[s.primary_hue ?? 354]} min={0} max={360} step={1} onValueChange={([v]) => update({ primary_hue: v })} />
          </div>
          <div>
            <Label>Saturation ({s.primary_saturation}%)</Label>
            <Slider value={[s.primary_saturation ?? 78]} min={0} max={100} step={1} onValueChange={([v]) => update({ primary_saturation: v })} />
          </div>
          <div>
            <Label>Lightness ({s.primary_lightness}%)</Label>
            <Slider value={[s.primary_lightness ?? 46]} min={10} max={90} step={1} onValueChange={([v]) => update({ primary_lightness: v })} />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border border-border bg-secondary/30">
          <span className="text-sm">প্রিভিউ:</span>
          <span
            className="px-3 py-1 text-white text-xs font-semibold"
            style={{ background: `hsl(${s.primary_hue} ${s.primary_saturation}% ${s.primary_lightness}%)` }}
          >
            ক্যাটাগরি ট্যাগ
          </span>
          <span
            className="px-3 py-1 text-white text-xs font-semibold rounded"
            style={{ background: `hsl(${s.primary_hue} ${(s.primary_saturation ?? 78) + 7}% ${(s.primary_lightness ?? 46) + 10}%)` }}
          >
            হোভার
          </span>
        </div>
      </section>

      {/* Accent color */}
      <section className="bg-card border border-border p-5 space-y-4">
        <h3 className="font-headline text-lg text-headline">Accent রঙ</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Hue ({s.accent_hue})</Label>
            <Slider value={[s.accent_hue ?? 38]} min={0} max={360} step={1} onValueChange={([v]) => update({ accent_hue: v })} />
          </div>
          <div>
            <Label>Saturation ({s.accent_saturation}%)</Label>
            <Slider value={[s.accent_saturation ?? 92]} min={0} max={100} step={1} onValueChange={([v]) => update({ accent_saturation: v })} />
          </div>
          <div>
            <Label>Lightness ({s.accent_lightness}%)</Label>
            <Slider value={[s.accent_lightness ?? 50]} min={10} max={90} step={1} onValueChange={([v]) => update({ accent_lightness: v })} />
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="bg-card border border-border p-5 space-y-4">
        <h3 className="font-headline text-lg text-headline">টাইপোগ্রাফি</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>হেডলাইন ফন্ট</Label>
            <select
              value={s.headline_font ?? "Noto Serif Bengali"}
              onChange={(e) => update({ headline_font: e.target.value })}
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
            >
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <Label>বডি ফন্ট</Label>
            <select
              value={s.body_font ?? "Hind Siliguri"}
              onChange={(e) => update({ body_font: e.target.value })}
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
            >
              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <Label>বেস ফন্ট সাইজ ({s.base_font_size}px)</Label>
            <Slider value={[s.base_font_size ?? 16]} min={14} max={20} step={1} onValueChange={([v]) => update({ base_font_size: v })} />
          </div>
          <div>
            <Label>হেডলাইন ওজন ({s.headline_weight})</Label>
            <Slider value={[s.headline_weight ?? 700]} min={400} max={900} step={100} onValueChange={([v]) => update({ headline_weight: v })} />
          </div>
        </div>
      </section>

      {/* Layout toggles */}
      <section className="bg-card border border-border p-5 space-y-3">
        <h3 className="font-headline text-lg text-headline">লেআউট কন্ট্রোল</h3>
        {[
          { key: "show_breaking_ticker", label: "ব্রেকিং নিউজ টিকার" },
          { key: "show_hero_block", label: "হিরো / ফিচার ব্লক" },
          { key: "show_divisions_tabs", label: "দেশজুড়ে ট্যাব" },
          { key: "show_latest_section", label: "সর্বশেষ সংবাদ সেকশন" },
        ].map((row) => (
          <div key={row.key} className="flex items-center justify-between p-3 border border-border bg-secondary/30">
            <span className="text-sm font-medium">{row.label}</span>
            <Switch
              checked={Boolean(s[row.key as keyof SiteSettings])}
              onCheckedChange={(v) => update({ [row.key]: v } as Partial<SiteSettings>)}
            />
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 bg-background border-t border-border py-3 -mx-3 px-3 sm:mx-0 sm:px-0">
        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ ও প্রয়োগ করুন"}
        </Button>
      </div>
    </div>
  );
}
