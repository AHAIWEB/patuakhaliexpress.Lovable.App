// Category-based SVG placeholder generator (data-URI, no network).
// Keeps grid layouts intact when posts have no image.

const PALETTES: Record<string, [string, string, string]> = {
  national: ["#7f1d1d", "#dc2626", "জাতীয়"],
  politics: ["#1e3a8a", "#2563eb", "রাজনীতি"],
  entertainment: ["#831843", "#db2777", "বিনোদন"],
  sports: ["#14532d", "#16a34a", "খেলা"],
  international: ["#1e40af", "#3b82f6", "আন্তর্জাতিক"],
  economy: ["#78350f", "#d97706", "অর্থনীতি"],
  business: ["#78350f", "#d97706", "ব্যবসা"],
  technology: ["#0c4a6e", "#0284c7", "প্রযুক্তি"],
  health: ["#064e3b", "#10b981", "স্বাস্থ্য"],
  lifestyle: ["#581c87", "#a855f7", "লাইফস্টাইল"],
  travel: ["#0e7490", "#06b6d4", "ভ্রমণ"],
  education: ["#3730a3", "#6366f1", "শিক্ষা"],
  "country-news": ["#365314", "#65a30d", "দেশ বাংলা"],
  "top-ten": ["#7c2d12", "#ea580c", "টপ টেন"],
  "photo-gallery": ["#4c1d95", "#8b5cf6", "ফটো"],
  people: ["#9f1239", "#e11d48", "পিপল"],
  default: ["#1f2937", "#475569", "সংবাদ"],
};

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));

export const getPlaceholderImage = (categorySlug?: string | null, title?: string | null): string => {
  const key = (categorySlug ?? "default").toLowerCase();
  const [c1, c2, label] = PALETTES[key] ?? PALETTES.default;
  const text = title ? title.slice(0, 40) : label;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>
<g opacity="0.15"><circle cx="650" cy="100" r="120" fill="#fff"/><circle cx="120" cy="420" r="80" fill="#fff"/></g>
<text x="40" y="260" font-family="'Noto Serif Bengali',serif" font-size="44" font-weight="700" fill="#fff" opacity="0.95">${escapeXml(label)}</text>
<text x="40" y="310" font-family="'Hind Siliguri',sans-serif" font-size="22" fill="#fff" opacity="0.75">${escapeXml(text)}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
