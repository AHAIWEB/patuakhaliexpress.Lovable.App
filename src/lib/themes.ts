// Home theme registry — defines the 4 available themes,
// their visual tokens, fonts, and a short label for the admin picker.

export type ThemeKey = "hybrid" | "magazine" | "minimal" | "bold" | "masonry" | "classic" | "prothom";

export interface ThemeDef {
  key: ThemeKey;
  name: string;          // Bengali label
  english: string;       // English subtitle
  description: string;
  // CSS variable overrides applied via :root style (HSL triplets, no hsl())
  tokens: Partial<Record<
    | "--primary" | "--primary-glow" | "--accent" | "--background" | "--foreground"
    | "--card" | "--muted" | "--muted-foreground" | "--border" | "--headline"
    | "--meta" | "--category-tag" | "--ring" | "--radius",
    string
  >>;
  fonts?: { headline?: string; body?: string };
  // Card layout style hint used by PostCard
  cardStyle?: "rounded" | "sharp" | "elevated" | "flat";
}

export const THEMES: ThemeDef[] = [
  {
    key: "hybrid",
    name: "হাইব্রিড",
    english: "Hybrid",
    description: "ম্যাগাজিন হিরো + পরিষ্কার গ্রিড — ক্লাসিক সংবাদপত্রের অনুভূতি",
    tokens: {
      "--primary": "354 78% 46%",
      "--primary-glow": "354 85% 56%",
      "--accent": "38 92% 50%",
      "--background": "0 0% 100%",
      "--foreground": "220 15% 12%",
      "--card": "0 0% 100%",
      "--border": "220 13% 90%",
      "--headline": "220 25% 8%",
      "--radius": "0.375rem",
    },
    fonts: { headline: "Noto Serif Bengali", body: "Hind Siliguri" },
    cardStyle: "sharp",
  },
  {
    key: "magazine",
    name: "ম্যাগাজিন",
    english: "Magazine",
    description: "বড় হেডলাইন, multi-column, এডিটোরিয়াল লেআউট — পত্রিকার মতো",
    tokens: {
      "--primary": "0 72% 38%",
      "--primary-glow": "0 80% 48%",
      "--accent": "45 95% 50%",
      "--background": "40 30% 98%",
      "--foreground": "20 15% 10%",
      "--card": "0 0% 100%",
      "--border": "30 15% 85%",
      "--headline": "20 25% 8%",
      "--muted": "40 25% 94%",
      "--radius": "0.125rem",
    },
    fonts: { headline: "Tiro Bangla", body: "Mina" },
    cardStyle: "flat",
  },
  {
    key: "minimal",
    name: "মিনিমাল",
    english: "Minimal",
    description: "অনেক negative space, সাদা ব্যাকগ্রাউন্ড, typography-focused",
    tokens: {
      "--primary": "220 90% 35%",
      "--primary-glow": "220 95% 50%",
      "--accent": "220 90% 50%",
      "--background": "0 0% 100%",
      "--foreground": "220 25% 10%",
      "--card": "0 0% 100%",
      "--border": "220 15% 92%",
      "--headline": "220 30% 6%",
      "--muted": "220 15% 97%",
      "--muted-foreground": "220 10% 45%",
      "--radius": "0rem",
    },
    fonts: { headline: "Hind Siliguri", body: "Hind Siliguri" },
    cardStyle: "flat",
  },
  {
    key: "bold",
    name: "বোল্ড",
    english: "Bold / Brutalist",
    description: "গাঢ় পটভূমি, উজ্জ্বল accent, বড় টাইপোগ্রাফি — modern news magazine",
    tokens: {
      "--primary": "16 95% 55%",
      "--primary-glow": "16 100% 65%",
      "--accent": "55 100% 55%",
      "--background": "220 20% 8%",
      "--foreground": "0 0% 96%",
      "--card": "220 18% 12%",
      "--border": "220 15% 22%",
      "--headline": "0 0% 98%",
      "--muted": "220 15% 16%",
      "--muted-foreground": "220 8% 70%",
      "--radius": "0.5rem",
    },
    fonts: { headline: "Baloo Da 2", body: "Hind Siliguri" },
    cardStyle: "elevated",
  },
  {
    key: "masonry",
    name: "কার্ড গ্রিড",
    english: "Card Grid (Pinterest)",
    description: "Pinterest-style masonry — variable height cards, soft shadows, rounded corners",
    tokens: {
      "--primary": "340 82% 52%",
      "--primary-glow": "340 90% 62%",
      "--accent": "260 75% 60%",
      "--background": "30 25% 97%",
      "--foreground": "240 15% 12%",
      "--card": "0 0% 100%",
      "--border": "30 15% 90%",
      "--headline": "240 25% 10%",
      "--muted": "30 20% 94%",
      "--radius": "1rem",
    },
    fonts: { headline: "Hind Siliguri", body: "Hind Siliguri" },
    cardStyle: "rounded",
  },
  {
    key: "classic",
    name: "ক্লাসিক সংবাদপত্র",
    english: "Classic Newspaper",
    description: "Serif-heavy, column-based layout — পুরোনো ছাপাখানার মতো ভাব",
    tokens: {
      "--primary": "0 0% 8%",
      "--primary-glow": "0 65% 40%",
      "--accent": "0 70% 38%",
      "--background": "40 30% 96%",
      "--foreground": "30 15% 8%",
      "--card": "40 25% 98%",
      "--border": "30 20% 75%",
      "--headline": "0 0% 5%",
      "--muted": "40 20% 92%",
      "--muted-foreground": "30 10% 35%",
      "--radius": "0rem",
    },
    fonts: { headline: "Tiro Bangla", body: "Mina" },
    cardStyle: "sharp",
  },
  {
    key: "prothom",
    name: "প্রথম আলো",
    english: "Bengali Daily",
    description: "প্রথম আলো-ধাঁচের পরিচ্ছন্ন গ্রিড — লাল accent, mixed-photo blocks, web-story carousel",
    tokens: {
      "--primary": "0 78% 48%",
      "--primary-glow": "0 85% 58%",
      "--accent": "0 78% 48%",
      "--background": "0 0% 100%",
      "--foreground": "220 12% 12%",
      "--card": "0 0% 100%",
      "--border": "220 13% 88%",
      "--headline": "220 20% 8%",
      "--muted": "220 14% 96%",
      "--muted-foreground": "220 9% 40%",
      "--radius": "0.25rem",
    },
    fonts: { headline: "Noto Serif Bengali", body: "Hind Siliguri" },
    cardStyle: "sharp",
  },
];

export const getTheme = (key?: string | null): ThemeDef =>
  THEMES.find((t) => t.key === key) ?? THEMES[0];

export const applyThemeTokens = (key?: string | null) => {
  const t = getTheme(key);
  const root = document.documentElement;
  // Remove any previous theme attribute, then set new for CSS-based overrides too
  root.setAttribute("data-theme", t.key);
  Object.entries(t.tokens).forEach(([k, v]) => {
    if (v) root.style.setProperty(k, v);
  });
};
