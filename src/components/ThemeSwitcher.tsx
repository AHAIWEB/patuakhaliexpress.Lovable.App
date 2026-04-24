import { useEffect, useState } from "react";
import { Palette, Check, X, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { useThemeKey } from "@/hooks/useThemeKey";
import { getThemeOverride, setThemeOverride } from "@/hooks/useSiteSettings";

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const active = useThemeKey();
  const [hasOverride, setHasOverride] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    setHasOverride(!!getThemeOverride());
  }, [active]);

  const pick = (k: ThemeKey) => {
    setThemeOverride(k);
    setHasOverride(true);
  };

  const reset = () => {
    setThemeOverride(null);
    setHasOverride(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="থিম পরিবর্তন"
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-72 max-h-[70vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm text-foreground">থিম নির্বাচন</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-md border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${previewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Desktop mockup"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${previewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Mobile mockup"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {THEMES.map((t) => {
              const swatches = [
                t.tokens["--background"],
                t.tokens["--primary"],
                t.tokens["--accent"],
                t.tokens["--foreground"],
              ].filter(Boolean) as string[];
              return (
                <button
                  key={t.key}
                  onClick={() => pick(t.key)}
                  className={`group relative w-full text-left px-3 py-2 rounded-md flex items-start gap-3 hover:bg-muted transition-colors ${
                    active === t.key ? "bg-muted ring-1 ring-primary/40" : ""
                  }`}
                >
                  {/* Color swatch preview */}
                  <div
                    className="shrink-0 mt-0.5 grid grid-cols-2 gap-0.5 rounded-md overflow-hidden border border-border"
                    style={{ width: 36, height: 36 }}
                    aria-hidden="true"
                  >
                    {swatches.slice(0, 4).map((hsl, i) => (
                      <div key={i} style={{ background: `hsl(${hsl})` }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.english}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                    <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full border border-border">
                      {swatches.map((hsl, i) => (
                        <div key={i} className="flex-1" style={{ background: `hsl(${hsl})` }} />
                      ))}
                    </div>
                  </div>
                  {active === t.key && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}

                  {/* Hover live mini-mockup */}
                  <div
                    className={`pointer-events-none absolute right-full top-0 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-10 rounded-lg shadow-2xl border overflow-hidden ${previewMode === "mobile" ? "w-40" : "w-56"}`}
                    style={{
                      background: `hsl(${t.tokens["--background"] ?? "0 0% 100%"})`,
                      color: `hsl(${t.tokens["--foreground"] ?? "220 15% 12%"})`,
                      borderColor: `hsl(${t.tokens["--border"] ?? "220 13% 90%"})`,
                      fontFamily: t.fonts?.body ?? "inherit",
                    }}
                    aria-hidden="true"
                  >
                    {/* Header bar */}
                    <div
                      className={`flex items-center justify-between font-bold ${previewMode === "mobile" ? "px-2 py-1.5 text-[8px]" : "px-2.5 py-1.5 text-[9px]"}`}
                      style={{
                        background: `hsl(${t.tokens["--primary"] ?? "354 78% 46%"})`,
                        color: "white",
                      }}
                    >
                      <span style={{ fontFamily: t.fonts?.headline ?? "inherit" }}>পটুয়াখালী এক্সপ্রেস</span>
                      <span className="opacity-70">≡</span>
                    </div>
                    {/* Hero card */}
                    <div className={`space-y-1.5 ${previewMode === "mobile" ? "p-1.5" : "p-2"}`}>
                      <div
                        className={previewMode === "mobile" ? "aspect-[10/16] rounded" : "aspect-[16/9] rounded"}
                        style={{ background: `linear-gradient(135deg, hsl(${t.tokens["--accent"] ?? "38 92% 50%"}), hsl(${t.tokens["--primary"] ?? "354 78% 46%"}))` }}
                      />
                      <div
                        className={`font-bold leading-tight ${previewMode === "mobile" ? "text-[9px] line-clamp-3" : "text-[10px] line-clamp-2"}`}
                        style={{
                          color: `hsl(${t.tokens["--headline"] ?? "220 25% 8%"})`,
                          fontFamily: t.fonts?.headline ?? "inherit",
                          fontWeight: 700,
                        }}
                      >
                        জাতীয় সংসদে নতুন বিল পাশ
                      </div>
                      <div className={`flex ${previewMode === "mobile" ? "flex-col items-start gap-1" : "gap-1.5"}`}>
                        <span
                          className="text-[7px] px-1.5 py-0.5 rounded"
                          style={{ background: `hsl(${t.tokens["--primary"] ?? "354 78% 46%"})`, color: "white" }}
                        >
                          রাজনীতি
                        </span>
                        <span className="text-[7px] opacity-60">৩ ঘণ্টা আগে</span>
                      </div>
                      {/* Mini cards */}
                      <div className={`grid gap-1 pt-1 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                        {[0, 1].map((k) => (
                          <div
                            key={k}
                            className="rounded p-1 border"
                            style={{
                              borderColor: `hsl(${t.tokens["--border"] ?? "220 13% 90%"})`,
                              background: `hsl(${t.tokens["--card"] ?? "0 0% 100%"})`,
                            }}
                          >
                            <div
                              className="aspect-square rounded mb-1"
                              style={{ background: `hsl(${t.tokens["--muted"] ?? "210 20% 96%"})` }}
                            />
                            <div className="h-1 w-3/4 rounded" style={{ background: `hsl(${t.tokens["--headline"] ?? "220 25% 8%"} / 0.8)` }} />
                            <div className="h-1 w-1/2 rounded mt-0.5" style={{ background: `hsl(${t.tokens["--muted-foreground"] ?? "220 10% 42%"} / 0.5)` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {hasOverride && (
            <div className="p-3 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" onClick={reset}>
                সাইট ডিফল্টে ফিরুন
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ThemeSwitcher;
