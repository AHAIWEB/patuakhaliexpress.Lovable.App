import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PostCard, { PostCardData } from "./PostCard";
import { useThemeKey } from "@/hooks/useThemeKey";

interface Props {
  title: string;
  slug: string;
  posts: PostCardData[];
  variant?: "grid" | "list" | "hero";
}

const CategorySection = ({ title, slug, posts, variant = "grid" }: Props) => {
  const theme = useThemeKey();
  if (!posts.length) return null;
  const [lead, ...rest] = posts;
  const href = slug ? `/category/${slug}` : "#";

  // Theme-specific section heading wrappers
  const headingWrap = (() => {
    switch (theme) {
      case "classic":
        return "flex items-center justify-between border-y-4 border-double border-foreground/70 py-2 mb-5";
      case "bold":
        return "flex items-center justify-between mb-5 pb-3 border-b-2 border-transparent bg-gradient-to-r from-primary/20 via-primary/5 to-transparent px-3 py-3 rounded-md";
      case "minimal":
        return "flex items-center justify-between mb-6 pb-1 border-b border-foreground/20";
      case "magazine":
        return "flex items-center justify-between border-b-2 border-foreground pb-2 mb-5";
      case "masonry":
        return "flex items-center justify-between mb-5";
      default:
        return "section-rule";
    }
  })();

  const titleEl = (() => {
    switch (theme) {
      case "classic":
        return (
          <h2 className="font-headline text-2xl sm:text-3xl text-headline italic">
            <Link to={href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </h2>
        );
      case "bold":
        return (
          <h2 className="font-headline text-xl sm:text-2xl uppercase tracking-wide text-headline">
            <Link to={href} className="hover:text-primary transition-colors inline-flex items-center gap-2">
              <span className="inline-block w-2 h-7 bg-gradient-to-b from-primary to-accent rounded-sm" />
              {title}
            </Link>
          </h2>
        );
      case "minimal":
        return (
          <h2 className="font-headline text-lg sm:text-xl font-medium text-foreground/90">
            <Link to={href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </h2>
        );
      case "magazine":
        return (
          <h2 className="font-headline text-2xl sm:text-3xl text-headline">
            <Link to={href} className="hover:text-primary transition-colors uppercase tracking-tight">
              {title}
            </Link>
          </h2>
        );
      case "masonry":
        return (
          <h2 className="font-headline text-xl sm:text-2xl text-headline">
            <Link to={href} className="hover:text-primary transition-colors inline-flex items-center gap-2">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">●</span>
              {title}
            </Link>
          </h2>
        );
      default:
        return (
          <h2 className="font-headline text-xl sm:text-2xl text-headline">
            <Link to={href} className="hover:text-primary transition-colors inline-flex items-center gap-2">
              <span className="inline-block w-1.5 h-6 bg-primary" />
              {title}
            </Link>
          </h2>
        );
    }
  })();

  return (
    <section className="py-6">
      <div className={headingWrap}>
        {titleEl}
        <Link
          to={href}
          className="text-xs sm:text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {variant === "hero" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PostCard post={lead} variant="lead" />
          </div>
          <div className="space-y-4">
            {rest.slice(0, 4).map((p) => (
              <PostCard key={p.id} post={p} variant="compact" />
            ))}
          </div>
        </div>
      ) : variant === "list" ? (
        <div className="space-y-5">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} variant="wide" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2 lg:row-span-2">
            <PostCard post={lead} variant="lead" />
          </div>
          {rest.slice(0, 4).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CategorySection;
