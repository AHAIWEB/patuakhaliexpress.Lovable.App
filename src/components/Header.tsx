import { Link } from "react-router-dom";
import { Menu, Search, User, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useThemeKey } from "@/hooks/useThemeKey";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}
interface Division {
  id: string;
  bn_name: string;
  slug: string;
}
interface District {
  id: string;
  bn_name: string;
  slug: string;
  division_id: string;
}

const Header = () => {
  const settings = useSiteSettings();
  const theme = useThemeKey();
  const [categories, setCategories] = useState<Category[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [today, setToday] = useState("");

  // Theme-specific styling for header chrome and nav links
  const headerClass =
    theme === "bold"
      ? "sticky top-0 z-40 bg-background border-b border-primary/40 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.4)]"
      : theme === "classic"
      ? "sticky top-0 z-40 bg-background border-b-4 border-double border-foreground/70"
      : theme === "masonry"
      ? "sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
      : theme === "minimal"
      ? "sticky top-0 z-40 bg-background border-b border-border/60"
      : theme === "magazine"
      ? "sticky top-0 z-40 bg-background border-b-2 border-foreground/80"
      : "sticky top-0 z-40 bg-background border-b border-border shadow-sm";

  const navWrapClass =
    theme === "bold"
      ? "bg-background border-y border-primary/40 hidden md:block"
      : theme === "classic"
      ? "bg-background border-y border-foreground/30 hidden md:block"
      : theme === "masonry"
      ? "bg-card hidden md:block"
      : theme === "minimal"
      ? "bg-background border-t border-border/60 hidden md:block"
      : "bg-primary text-primary-foreground hidden md:block";

  const navLinkClass = (() => {
    const base = "text-sm font-semibold whitespace-nowrap transition-all";
    switch (theme) {
      case "bold":
        return `px-4 py-3 ${base} text-foreground hover:text-primary uppercase tracking-wider`;
      case "classic":
        return `px-4 py-3 ${base} text-foreground hover:text-primary font-headline`;
      case "masonry":
        return `mx-1 my-2 px-4 py-1.5 ${base} text-foreground hover:bg-primary hover:text-primary-foreground rounded-full`;
      case "minimal":
        return `px-4 py-3 ${base} text-foreground/80 hover:text-foreground hover:underline underline-offset-8`;
      default:
        return `px-3 py-2.5 ${base} hover:bg-[hsl(var(--primary-glow))]`;
    }
  })();

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: divs }, { data: dists }] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name,slug,parent_id")
          .eq("show_in_menu", true)
          .order("display_order"),
        supabase.from("divisions").select("id,bn_name,slug").order("display_order"),
        supabase
          .from("districts")
          .select("id,bn_name,slug,division_id")
          .order("display_order"),
      ]);
      setCategories(cats ?? []);
      setDivisions(divs ?? []);
      setDistricts(dists ?? []);
    })();

    const d = new Date();
    setToday(
      d.toLocaleDateString("bn-BD", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const topCats = categories.filter((c) => !c.parent_id);
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);
  const districtsIn = (divId: string) =>
    districts.filter((d) => d.division_id === divId);

  return (
    <header className={headerClass}>
      {/* Top bar */}
      <div className="bg-[hsl(var(--headline))] text-primary-foreground text-xs">
        <div className="container-news flex items-center justify-between py-1.5">
          <span className="opacity-80">{today}</span>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="opacity-80 hover:opacity-100 flex items-center gap-1">
              <User className="h-3 w-3" /> লগইন
            </Link>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="container-news py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.site_name}
              className="h-10 sm:h-12 w-auto object-contain"
            />
          ) : (
            <>
              <div className="bg-primary text-primary-foreground font-headline text-xl sm:text-2xl px-3 py-1.5 leading-none">
                পটুয়াখালী
              </div>
              <div className="font-headline text-xl sm:text-2xl text-headline leading-none">
                এক্সপ্রেস
              </div>
            </>
          )}
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <nav className="flex flex-col gap-1 mt-6">
              <Link to="/" className="px-3 py-2 rounded hover:bg-secondary font-medium">
                হোম
              </Link>
              {topCats.map((c) => {
                const subs = childrenOf(c.id);
                return (
                  <div key={c.id}>
                    <Link
                      to={`/category/${c.slug}`}
                      className="px-3 py-2 rounded hover:bg-secondary block font-medium"
                    >
                      {c.name}
                    </Link>
                    {subs.length > 0 && (
                      <div className="ml-4 border-l border-border">
                        {subs.map((s) => (
                          <Link
                            key={s.id}
                            to={`/category/${s.slug}`}
                            className="px-3 py-1.5 rounded hover:bg-secondary block text-sm text-muted-foreground"
                          >
                            • {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {divisions.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1 text-xs uppercase text-muted-foreground">
                    বিভাগ
                  </div>
                  {divisions.map((d) => (
                    <details key={d.id} className="px-1">
                      <summary className="px-2 py-2 rounded hover:bg-secondary cursor-pointer text-sm">
                        {d.bn_name}
                      </summary>
                      <div className="ml-4 border-l border-border">
                        <Link
                          to={`/division/${d.slug}`}
                          className="px-3 py-1.5 block text-xs font-medium text-primary hover:bg-secondary"
                        >
                          সব {d.bn_name}
                        </Link>
                        {districtsIn(d.id).map((dt) => (
                          <Link
                            key={dt.id}
                            to={`/district/${dt.slug}`}
                            className="px-3 py-1.5 block text-xs text-muted-foreground hover:bg-secondary"
                          >
                            • {dt.bn_name}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ))}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category nav (desktop) */}
      <nav className="bg-primary text-primary-foreground hidden md:block">
        <div className="container-news flex items-center gap-1 overflow-x-auto">
          <Link
            to="/"
            className="px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors whitespace-nowrap"
          >
            হোম
          </Link>
          {topCats.map((c) => {
            const subs = childrenOf(c.id);
            if (subs.length === 0) {
              return (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors whitespace-nowrap"
                >
                  {c.name}
                </Link>
              );
            }
            return (
              <DropdownMenu key={c.id}>
                <DropdownMenuTrigger className="px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors whitespace-nowrap inline-flex items-center gap-1 outline-none">
                  {c.name} <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background z-50">
                  <DropdownMenuItem asChild>
                    <Link to={`/category/${c.slug}`}>সব {c.name}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {subs.map((s) => (
                    <DropdownMenuItem key={s.id} asChild>
                      <Link to={`/category/${s.slug}`}>{s.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          {/* Geo dropdown */}
          {divisions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors whitespace-nowrap inline-flex items-center gap-1 outline-none">
                বিভাগ <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background z-50 max-h-[70vh] overflow-y-auto">
                {divisions.map((d) => (
                  <div key={d.id}>
                    <DropdownMenuLabel className="text-primary">
                      <Link to={`/division/${d.slug}`} className="hover:underline">
                        {d.bn_name} →
                      </Link>
                    </DropdownMenuLabel>
                    {districtsIn(d.id).slice(0, 8).map((dt) => (
                      <DropdownMenuItem key={dt.id} asChild>
                        <Link to={`/district/${dt.slug}`} className="text-sm">
                          {dt.bn_name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
