import { Link } from "react-router-dom";
import { ArrowRight, Quote, Play } from "lucide-react";
import PostCard, { PostCardData } from "./PostCard";
import { useThemeKey } from "@/hooks/useThemeKey";
import { getPlaceholderImage } from "@/lib/placeholder";

export type SectionVariant =
  | "grid"
  | "list"
  | "hero"
  | "web-story"
  | "opinion"
  | "mosaic"
  | "large-feature"
  | "numbered-list"
  | "top-strip";

interface Props {
  title: string;
  slug: string;
  posts: PostCardData[];
  variant?: SectionVariant;
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
      case "prothom":
        return "flex items-center justify-between mb-4 pb-2 border-b border-foreground/15";
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
      case "prothom":
        return (
          <h2 className="font-headline text-lg sm:text-xl text-primary font-bold">
            <Link to={href} className="inline-flex items-center gap-1.5 hover:opacity-80">
              {title}
              <ArrowRight className="h-4 w-4" />
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
        {variant !== "web-story" && theme !== "prothom" && (
          <Link
            to={href}
            className="text-xs sm:text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
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
      ) : variant === "web-story" ? (
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-thin">
          <div className="flex gap-3 sm:gap-4 pb-3 snap-x snap-mandatory">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/post/${p.slug}`}
                className="group relative snap-start flex-shrink-0 w-[44%] sm:w-[28%] lg:w-[16%] aspect-[3/5] overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                  alt={p.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/85 backdrop-blur flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 sm:p-3">
                  <h3 className="font-headline text-[0.78rem] sm:text-sm text-white leading-snug line-clamp-3">
                    {p.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : variant === "opinion" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/post/${p.slug}`}
              className="group flex items-start gap-3 p-4 bg-muted/40 rounded-md hover:bg-muted transition-colors"
            >
              <Quote className="h-4 w-4 text-primary shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <h3 className="font-headline text-sm sm:text-base text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {p.title}
                </h3>
                {p.source?.name && (
                  <p className="text-xs text-muted-foreground mt-2 italic truncate">
                    ✎ {p.source.name}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-muted shrink-0 ring-2 ring-primary/20">
                <img
                  src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : variant === "large-feature" ? (
        <div>
          <Link to={`/post/${lead.slug}`} className="group block mb-5">
            <div className="aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-muted rounded-md">
              <img
                src={lead.image_url || getPlaceholderImage(lead.category?.slug, lead.title)}
                alt={lead.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <h3 className="font-headline text-xl sm:text-2xl lg:text-3xl text-headline mt-4 leading-tight text-balance group-hover:text-primary transition-colors">
              {lead.title}
            </h3>
            {lead.excerpt && (
              <p className="text-sm sm:text-base text-muted-foreground mt-2 line-clamp-2 max-w-3xl">
                {lead.excerpt}
              </p>
            )}
          </Link>
          {rest.length > 0 && (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 pt-4 border-t border-border">
              {rest.slice(0, 4).map((p) => (
                <PostCard key={p.id} post={p} variant="compact" />
              ))}
            </div>
          )}
        </div>
      ) : variant === "mosaic" ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:h-[480px]">
          <Link
            to={`/post/${lead.slug}`}
            className="group relative col-span-2 row-span-2 overflow-hidden rounded-md bg-muted"
          >
            <img
              src={lead.image_url || getPlaceholderImage(lead.category?.slug, lead.title)}
              alt={lead.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              {lead.category && (
                <span className="category-tag mb-2">{lead.category.name}</span>
              )}
              <h3 className="font-headline text-base sm:text-xl lg:text-2xl text-white leading-tight line-clamp-3">
                {lead.title}
              </h3>
            </div>
          </Link>
          {rest.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              to={`/post/${p.slug}`}
              className="group relative overflow-hidden rounded-md bg-muted aspect-square lg:aspect-auto"
            >
              <img
                src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                alt={p.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <h4 className="font-headline text-xs sm:text-sm text-white leading-snug line-clamp-3">
                  {p.title}
                </h4>
              </div>
            </Link>
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
