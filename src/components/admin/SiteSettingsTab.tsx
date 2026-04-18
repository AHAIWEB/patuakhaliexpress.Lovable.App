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
import { THEMES } from "@/lib/themes";
import { Check } from "lucide-react";

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
  const [uploading, setUploading] = useState<"logo" | "og" | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (data) setS(data as Partial<SiteSettings>);
      setLoading(false);
    })();
  }, []);

  const update = (patch: Partial<SiteSettings>) => setS((p) => ({ ...p, ...patch }));

  const uploadImage = async (file: File, kind: "logo" | "og") => {
    if (!file.type.startsWith("image/")) return toast.error("শুধু ছবি আপলোড করুন");
    if (file.size > 2 * 1024 * 1024) return toast.error("সর্বোচ্চ 2MB");
    setUploading(kind);
    const ext = file.name.split(".").pop() || "png";
    const path = `${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    const patch = kind === "logo" ? { logo_url: data.publicUrl } : { og_image_url: data.publicUrl };
    setS((p) => ({ ...p, ...patch }));
    await supabase.from("site_settings").update(patch).eq("id", 1);
    await refreshSiteSettings();
    toast.success("আপলোড সম্পন্ন");
    setUploading(null);
  };

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
      {/* Home Theme Picker */}
      <section className="bg-card border border-border p-5 space-y-4">
        <div>
          <h3 className="font-headline text-lg text-headline">হোমপেজ থিম</h3>
          <p className="text-xs text-muted-foreground mt-1">
            ৬টি ভিন্ন ডিজাইন — সিলেক্ট করলে হোম, ক্যাটাগরি, পোস্ট সব পেজে apply হবে
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const active = (s.home_theme ?? "hybrid") === t.key;
            const bg = t.tokens["--background"] ?? "0 0% 100%";
            const fg = t.tokens["--foreground"] ?? "220 15% 12%";
            const card = t.tokens["--card"] ?? bg;
            const primary = t.tokens["--primary"] ?? "354 78% 46%";
            const accent = t.tokens["--accent"] ?? "38 92% 50%";
            const border = t.tokens["--border"] ?? "220 13% 90%";
            const radius = t.tokens["--radius"] ?? "0.375rem";
            const headlineFont = t.fonts?.headline ?? "Hind Siliguri";

            // Render different mini-mock per theme
            const renderMock = () => {
              const common = { background: `hsl(${bg})`, color: `hsl(${fg})`, fontFamily: headlineFont };
              switch (t.key) {
                case "magazine":
                  return (
                    <div className="aspect-[16/10] p-2.5 flex flex-col gap-1.5" style={common}>
                      <div className="text-center border-y-2 py-1" style={{ borderColor: `hsl(${fg})` }}>
                        <div className="text-[7px] tracking-[0.2em] font-bold uppercase" style={{ color: `hsl(${primary})` }}>Top Story</div>
                        <div className="h-2 mx-auto mt-0.5 w-3/4 rounded-sm" style={{ background: `hsl(${fg} / 0.8)` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        <div className="rounded-sm" style={{ background: `hsl(${primary} / 0.25)` }} />
                        <div className="rounded-sm" style={{ background: `hsl(${primary} / 0.15)` }} />
                        <div className="rounded-sm" style={{ background: `hsl(${accent} / 0.3)` }} />
                      </div>
                    </div>
                  );
                case "minimal":
                  return (
                    <div className="aspect-[16/10] p-3 flex flex-col gap-2" style={common}>
                      <div className="h-1.5 w-12 rounded-full" style={{ background: `hsl(${primary})` }} />
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full rounded-sm" style={{ background: `hsl(${fg} / 0.85)` }} />
                        <div className="h-1.5 w-2/3 rounded-sm" style={{ background: `hsl(${fg} / 0.4)` }} />
                      </div>
                      <div className="flex-1 mt-1 grid grid-cols-2 gap-2">
                        <div className="rounded-sm" style={{ background: `hsl(${fg} / 0.06)` }} />
                        <div className="rounded-sm" style={{ background: `hsl(${fg} / 0.06)` }} />
                      </div>
                    </div>
                  );
                case "bold":
                  return (
                    <div className="aspect-[16/10] p-2.5 flex flex-col gap-1.5" style={common}>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full" style={{ background: `hsl(${primary})` }} />
                        <div className="h-2 w-10 uppercase rounded-sm" style={{ background: `hsl(${accent})` }} />
                      </div>
                      <div className="h-3 w-full rounded" style={{ background: `hsl(${primary} / 0.7)` }} />
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        <div className="rounded shadow-md" style={{ background: `hsl(${card})`, border: `1px solid hsl(${border})` }} />
                        <div className="rounded shadow-md" style={{ background: `hsl(${card})`, border: `1px solid hsl(${border})` }} />
                        <div className="rounded shadow-md" style={{ background: `hsl(${accent} / 0.4)` }} />
                      </div>
                    </div>
                  );
                case "masonry":
                  return (
                    <div className="aspect-[16/10] p-2 grid grid-cols-3 gap-1.5" style={common}>
                      <div className="rounded-xl row-span-2" style={{ background: `hsl(${primary} / 0.3)` }} />
                      <div className="rounded-xl" style={{ background: `hsl(${accent} / 0.35)` }} />
                      <div className="rounded-xl row-span-2" style={{ background: `hsl(${fg} / 0.12)` }} />
                      <div className="rounded-xl" style={{ background: `hsl(${primary} / 0.18)` }} />
                    </div>
                  );
                case "classic":
                  return (
                    <div className="aspect-[16/10] p-2 flex flex-col gap-1" style={common}>
                      <div className="text-center border-y border-double py-0.5" style={{ borderColor: `hsl(${fg} / 0.7)` }}>
                        <div className="font-serif italic text-[9px]" style={{ color: `hsl(${fg})` }}>The Daily</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 flex-1 text-[6px] leading-tight">
                        {[0,1,2].map(i => (
                          <div key={i} className="space-y-0.5">
                            <div className="h-1 rounded-sm" style={{ background: `hsl(${fg} / 0.7)` }} />
                            <div className="h-0.5 rounded-sm" style={{ background: `hsl(${fg} / 0.3)` }} />
                            <div className="h-0.5 rounded-sm" style={{ background: `hsl(${fg} / 0.3)` }} />
                            <div className="h-0.5 rounded-sm" style={{ background: `hsl(${fg} / 0.3)` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                case "prothom":
                  return (
                    <div className="aspect-[16/10] p-2 flex flex-col gap-1" style={common}>
                      <div className="flex items-center justify-between border-b pb-0.5" style={{ borderColor: `hsl(${primary})` }}>
                        <div className="text-[8px] font-bold" style={{ color: `hsl(${primary})` }}>প্রথম</div>
                        <div className="h-1 w-6 rounded-sm" style={{ background: `hsl(${fg} / 0.3)` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        <div className="col-span-2 rounded-sm" style={{ background: `hsl(${primary} / 0.2)` }} />
                        <div className="space-y-0.5">
                          <div className="h-1 rounded-sm" style={{ background: `hsl(${fg} / 0.5)` }} />
                          <div className="h-1 rounded-sm" style={{ background: `hsl(${fg} / 0.3)` }} />
                          <div className="h-1 rounded-sm" style={{ background: `hsl(${fg} / 0.3)` }} />
                        </div>
                      </div>
                    </div>
                  );
                default: // hybrid
                  return (
                    <div className="aspect-[16/10] p-2.5 flex flex-col gap-1.5" style={common}>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ background: `hsl(${primary})` }} />
                        <div className="h-1.5 flex-1 rounded-sm" style={{ background: `hsl(${primary} / 0.5)` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        <div className="col-span-2 rounded-sm" style={{ background: `hsl(${primary} / 0.18)` }} />
                        <div className="space-y-1">
                          <div className="h-2 rounded-sm" style={{ background: `hsl(${accent} / 0.7)` }} />
                          <div className="h-2 rounded-sm" style={{ background: `hsl(${fg} / 0.15)` }} />
                          <div className="h-2 rounded-sm" style={{ background: `hsl(${fg} / 0.1)` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-2.5 rounded-sm" style={{ background: `hsl(${fg} / 0.1)` }} />
                        <div className="h-2.5 rounded-sm" style={{ background: `hsl(${fg} / 0.1)` }} />
                        <div className="h-2.5 rounded-sm" style={{ background: `hsl(${fg} / 0.1)` }} />
                      </div>
                    </div>
                  );
              }
            };

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => update({ home_theme: t.key })}
                className={`relative text-left border-2 transition-all overflow-hidden ${
                  active ? "border-primary ring-2 ring-primary/30 shadow-lg" : "border-border hover:border-primary/50"
                }`}
                style={{ borderRadius: radius }}
              >
                {active && (
                  <span className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                {renderMock()}
                <div className="p-2.5 bg-card border-t border-border">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="font-headline text-sm text-headline">{t.name}</div>
                    <div className="flex gap-0.5 shrink-0">
                      <span className="h-3 w-3 rounded-full border border-border" style={{ background: `hsl(${primary})` }} />
                      <span className="h-3 w-3 rounded-full border border-border" style={{ background: `hsl(${accent})` }} />
                      <span className="h-3 w-3 rounded-full border border-border" style={{ background: `hsl(${bg})` }} />
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Brand identity */}
      <section className="bg-card border border-border p-5 space-y-4">
        <h3 className="font-headline text-lg text-headline">সাইট পরিচিতি</h3>

        {/* Logo + OG image upload */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>সাইট লোগো (Header-এ দেখাবে)</Label>
            <div className="flex items-center gap-3 p-3 border border-border bg-secondary/30 min-h-[88px]">
              {s.logo_url ? (
                <>
                  <img src={s.logo_url} alt="logo" className="h-14 w-auto object-contain bg-white rounded" />
                  <Button
                    variant="ghost" size="icon"
                    onClick={async () => {
                      update({ logo_url: null });
                      await supabase.from("site_settings").update({ logo_url: null }).eq("id", 1);
                      await refreshSiteSettings();
                    }}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">লোগো নেই — ডিফল্ট টেক্সট দেখাবে</span>
              )}
              <label className="ml-auto">
                <input
                  type="file" accept="image/*" hidden
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")}
                />
                <Button size="sm" variant="outline" asChild disabled={uploading === "logo"}>
                  <span className="cursor-pointer">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {uploading === "logo" ? "আপলোড..." : "আপলোড"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>OG / Share Image (1200x630 প্রস্তাবিত)</Label>
            <div className="flex items-center gap-3 p-3 border border-border bg-secondary/30 min-h-[88px]">
              {s.og_image_url ? (
                <img src={s.og_image_url} alt="og" className="h-14 w-auto object-contain rounded" />
              ) : (
                <span className="text-xs text-muted-foreground">কোনো OG ইমেজ নেই</span>
              )}
              <label className="ml-auto">
                <input
                  type="file" accept="image/*" hidden
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "og")}
                />
                <Button size="sm" variant="outline" asChild disabled={uploading === "og"}>
                  <span className="cursor-pointer">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {uploading === "og" ? "আপলোড..." : "আপলোড"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>সাইটের নাম</Label>
            <Input value={s.site_name ?? ""} onChange={(e) => update({ site_name: e.target.value })} />
          </div>
          <div>
            <Label>OG Image URL (manual)</Label>
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
