import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  primary_hue: number;
  primary_saturation: number;
  primary_lightness: number;
  accent_hue: number;
  accent_saturation: number;
  accent_lightness: number;
  headline_font: string;
  body_font: string;
  base_font_size: number;
  headline_weight: number;
  show_breaking_ticker: boolean;
  show_hero_block: boolean;
  show_divisions_tabs: boolean;
  show_latest_section: boolean;
  site_name: string;
  site_description: string;
  og_image_url: string | null;
}

const DEFAULTS: SiteSettings = {
  primary_hue: 354,
  primary_saturation: 78,
  primary_lightness: 46,
  accent_hue: 38,
  accent_saturation: 92,
  accent_lightness: 50,
  headline_font: "Noto Serif Bengali",
  body_font: "Hind Siliguri",
  base_font_size: 16,
  headline_weight: 700,
  show_breaking_ticker: true,
  show_hero_block: true,
  show_divisions_tabs: true,
  show_latest_section: true,
  site_name: "পটুয়াখালী এক্সপ্রেস",
  site_description: "সর্বশেষ বাংলা সংবাদ এক জায়গায়।",
  og_image_url: null,
};

let cache: SiteSettings | null = null;
const subscribers = new Set<(s: SiteSettings) => void>();

const apply = (s: SiteSettings) => {
  const root = document.documentElement;
  root.style.setProperty("--primary", `${s.primary_hue} ${s.primary_saturation}% ${s.primary_lightness}%`);
  root.style.setProperty(
    "--primary-glow",
    `${s.primary_hue} ${Math.min(s.primary_saturation + 7, 100)}% ${Math.min(s.primary_lightness + 10, 90)}%`,
  );
  root.style.setProperty("--ring", `${s.primary_hue} ${s.primary_saturation}% ${s.primary_lightness}%`);
  root.style.setProperty("--category-tag", `${s.primary_hue} ${s.primary_saturation}% ${s.primary_lightness}%`);
  root.style.setProperty("--accent", `${s.accent_hue} ${s.accent_saturation}% ${s.accent_lightness}%`);
  root.style.setProperty("--base-font-size", `${s.base_font_size}px`);
  root.style.setProperty("--headline-weight", String(s.headline_weight));
  root.style.setProperty("--font-headline", `'${s.headline_font}', 'Hind Siliguri', serif`);
  root.style.setProperty("--font-body", `'${s.body_font}', system-ui, sans-serif`);
};

export const refreshSiteSettings = async () => {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const s = { ...DEFAULTS, ...(data ?? {}) } as SiteSettings;
  cache = s;
  apply(s);
  subscribers.forEach((fn) => fn(s));
  return s;
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? DEFAULTS);

  useEffect(() => {
    if (!cache) refreshSiteSettings();
    else apply(cache);
    const fn = (s: SiteSettings) => setSettings(s);
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  }, []);

  return settings;
};
