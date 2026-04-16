import { Link } from "react-router-dom";
import { Menu, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Header = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [today, setToday] = useState("");

  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name,slug")
      .eq("show_in_menu", true)
      .order("display_order")
      .then(({ data }) => setCategories(data ?? []));

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

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
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
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground font-headline text-xl sm:text-2xl px-3 py-1.5 leading-none">
            পটুয়াখালী
          </div>
          <div className="font-headline text-xl sm:text-2xl text-headline leading-none">
            এক্সপ্রেস
          </div>
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
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-1 mt-6">
              <Link to="/" className="px-3 py-2 rounded hover:bg-secondary font-medium">
                হোম
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="px-3 py-2 rounded hover:bg-secondary"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category nav */}
      <nav className="bg-primary text-primary-foreground hidden md:block">
        <div className="container-news flex items-center gap-1 overflow-x-auto">
          <Link
            to="/"
            className="px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors whitespace-nowrap"
          >
            হোম
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors whitespace-nowrap"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
