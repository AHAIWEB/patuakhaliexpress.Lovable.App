import { useEffect, useState } from "react";
import { Palette, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { useThemeKey } from "@/hooks/useThemeKey";
import { getThemeOverride, setThemeOverride } from "@/hooks/useSiteSettings";

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const active = useThemeKey();
  const [hasOverride, setHasOverride] = useState<boolean>(false);

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
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => pick(t.key)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-start gap-2 hover:bg-muted transition-colors ${
                  active === t.key ? "bg-muted" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.english}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                </div>
                {active === t.key && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
              </button>
            ))}
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
