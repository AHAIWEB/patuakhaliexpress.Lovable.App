import { Link } from "react-router-dom";
import { ArrowRight, Quote, Play, ExternalLink } from "lucide-react";
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
  | "top-strip"
  | "sponsored"
  | "cinematic"
  | "magazine-collage"
  | "neon-glass"
  | "polaroid";

interface Props {
  title: string;
  slug: string;
  posts: PostCardData[];
  variant?: SectionVariant;
  icon?: string | null;
  accentColor?: string | null;
}

// Validate hex/CSS color or hsl token; returns inline style if non-empty
const accentStyle = (color?: string | null): React.CSSProperties | undefined => {
  if (!color) return undefined;
  return { backgroundColor: color };
};

const CategorySection = ({ title, slug, posts, variant = "grid", icon, accentColor }: Props) => {
  const theme = useThemeKey();
  if (!posts.length) return null;
  const [lead, ...rest] = posts;
  const href = slug ? `/category/${slug}` : "#";

  // === SPONSORED — distinct border, label, external-link icons ===
  if (variant === "sponsored") {
    return (
      <section className="py-6">
        <div className="relative border-2 border-dashed border-muted-foreground/40 rounded-md p-4 sm:p-5 bg-muted/20">
          <div className="absolute -top-2.5 left-4 bg-background px-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            বিজ্ঞাপন · Sponsored
          </div>
          <div className="flex items-center justify-between mb-4 mt-1">
            <h2 className="font-headline text-lg sm:text-xl text-headline inline-flex items-center gap-2">
              {icon && <span className="text-xl">{icon}</span>}
              {accentColor && (
                <span className="inline-block w-1.5 h-6 rounded-sm" style={accentStyle(accentColor)} />
              )}
              {title}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 6).map((p) => {
              const isExternal = !!p.source?.name && /^https?:/i.test(p.image_url ?? "");
              const Inner = (
                <article className="group bg-card border border-border rounded p-3 hover:border-primary/40 transition-colors">
                  <div className="aspect-[16/10] overflow-hidden bg-muted rounded mb-3">
                    <img
                      src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-headline text-sm leading-snug text-headline group-hover:text-primary line-clamp-3 inline-flex items-start gap-1.5">
                    <span className="flex-1">{p.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
                  </h3>
                  {p.source?.name && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">
                      {p.source.name}
                    </p>
                  )}
                </article>
              );
              return isExternal ? (
                <a
                  key={p.id}
                  href={p.image_url ?? "#"}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="block"
                >
                  {Inner}
                </a>
              ) : (
                <Link key={p.id} to={`/post/${p.slug}`} className="block">
                  {Inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

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

  // Stripe + icon prefix shared across themes (when configured)
  const accentPrefix = (
    <>
      {accentColor && (
        <span
          className="inline-block w-1.5 h-7 rounded-sm shrink-0"
          style={accentStyle(accentColor)}
          aria-hidden
        />
      )}
      {icon && <span className="text-xl leading-none shrink-0">{icon}</span>}
    </>
  );

  const titleEl = (() => {
    switch (theme) {
      case "classic":
        return (
          <h2 className="font-headline text-2xl sm:text-3xl text-headline italic inline-flex items-center gap-2">
            {accentPrefix}
            <Link to={href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </h2>
        );
      case "bold":
        return (
          <h2 className="font-headline text-xl sm:text-2xl uppercase tracking-wide text-headline">
            <Link to={href} className="hover:text-primary transition-colors inline-flex items-center gap-2">
              {accentColor || icon ? (
                accentPrefix
              ) : (
                <span className="inline-block w-2 h-7 bg-gradient-to-b from-primary to-accent rounded-sm" />
              )}
              {title}
            </Link>
          </h2>
        );
      case "minimal":
        return (
          <h2 className="font-headline text-lg sm:text-xl font-medium text-foreground/90 inline-flex items-center gap-2">
            {accentPrefix}
            <Link to={href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </h2>
        );
      case "magazine":
        return (
          <h2 className="font-headline text-2xl sm:text-3xl text-headline inline-flex items-center gap-2">
            {accentPrefix}
            <Link to={href} className="hover:text-primary transition-colors uppercase tracking-tight">
              {title}
            </Link>
          </h2>
        );
      case "masonry":
        return (
          <h2 className="font-headline text-xl sm:text-2xl text-headline">
            <Link to={href} className="hover:text-primary transition-colors inline-flex items-center gap-2">
              {accentColor ? (
                <span className="inline-block w-1.5 h-6 rounded-sm" style={accentStyle(accentColor)} />
              ) : (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">●</span>
              )}
              {icon && <span className="text-xl">{icon}</span>}
              {title}
            </Link>
          </h2>
        );
      case "prothom":
        return (
          <h2 className="font-headline text-lg sm:text-xl text-primary font-bold inline-flex items-center gap-2">
            {accentColor && (
              <span className="inline-block w-1.5 h-5 rounded-sm" style={accentStyle(accentColor)} />
            )}
            {icon && <span className="text-lg">{icon}</span>}
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
              {accentColor ? (
                <span className="inline-block w-1.5 h-6 rounded-sm" style={accentStyle(accentColor)} />
              ) : (
                <span className="inline-block w-1.5 h-6 bg-primary" />
              )}
              {icon && <span className="text-xl">{icon}</span>}
              {title}
            </Link>
          </h2>
        );
    }
  })();

  return (
    <section className="py-6">
      {variant !== "top-strip" && (
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
      )}

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
      ) : variant === "numbered-list" ? (
        <ol className="grid gap-2 sm:grid-cols-2">
          {posts.slice(0, 10).map((p, i) => (
            <li key={p.id}>
              <Link
                to={`/post/${p.slug}`}
                className="group flex items-start gap-3 py-3 border-b border-border/60 hover:bg-muted/40 px-2 -mx-2 rounded transition-colors"
              >
                <span
                  className={`font-headline text-3xl sm:text-4xl leading-none shrink-0 w-10 text-right ${
                    i < 3 ? "text-primary" : "text-muted-foreground/50"
                  }`}
                >
                  {i + 1}
                </span>
                <h3 className="font-headline text-sm sm:text-base text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3 pt-0.5">
                  {p.title}
                </h3>
              </Link>
            </li>
          ))}
        </ol>
      ) : variant === "top-strip" ? (
        <div className="relative overflow-hidden bg-primary/5 border border-primary/20 rounded-md">
          <div className="flex items-center">
            <span
              className="shrink-0 text-primary-foreground px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide inline-flex items-center gap-1.5"
              style={accentColor ? { backgroundColor: accentColor } : { backgroundColor: "hsl(var(--primary))" }}
            >
              {icon && <span>{icon}</span>}
              {title}
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex gap-8 whitespace-nowrap py-2 px-4 animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
                {[...posts, ...posts].map((p, i) => (
                  <Link
                    key={`${p.id}-${i}`}
                    to={`/post/${p.slug}`}
                    className="text-sm hover:text-primary transition-colors inline-flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : variant === "cinematic" ? (
        // Netflix-like cinematic dark band: large hero + film-strip thumbnails
        <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 bg-gradient-to-b from-foreground via-foreground/95 to-foreground text-background rounded-lg overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-2 film-strip opacity-90" />
          <div className="absolute inset-x-0 bottom-0 h-2 film-strip opacity-90" />
          <div className="grid gap-5 lg:grid-cols-5 items-center relative z-10">
            <Link to={`/post/${lead.slug}`} className="group block lg:col-span-3 relative aspect-[16/9] overflow-hidden rounded-md">
              <img
                src={lead.image_url || getPlaceholderImage(lead.category?.slug, lead.title)}
                alt={lead.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 cinematic-overlay" />
              <div className="absolute bottom-0 inset-x-0 p-5">
                <span className="inline-block text-[10px] uppercase tracking-[0.2em] gold-accent font-bold mb-1.5">
                  ▶ ফিচার্ড
                </span>
                <h3 className="font-headline text-xl sm:text-2xl lg:text-3xl text-white leading-tight line-clamp-3 text-balance">
                  {lead.title}
                </h3>
              </div>
            </Link>
            <div className="lg:col-span-2 space-y-3">
              {rest.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/post/${p.slug}`} className="group flex gap-3 items-start hover:bg-white/5 rounded p-2 -mx-2 transition-colors">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-background/10">
                    <img
                      src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h4 className="font-headline text-sm text-white leading-snug line-clamp-3 group-hover:gold-accent transition-colors">
                    {p.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : variant === "magazine-collage" ? (
        // Vogue-style asymmetric editorial collage
        <div className="grid gap-3 sm:gap-4 grid-cols-6 grid-rows-2 lg:h-[520px] auto-rows-[180px] sm:auto-rows-auto">
          <Link
            to={`/post/${lead.slug}`}
            className="group relative col-span-6 sm:col-span-4 row-span-2 overflow-hidden rounded-lg bg-muted"
          >
            <img
              src={lead.image_url || getPlaceholderImage(lead.category?.slug, lead.title)}
              alt={lead.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
              {lead.category && (
                <span className="text-[11px] uppercase tracking-[0.25em] text-white/90 font-bold mb-2">
                  {lead.category.name}
                </span>
              )}
              <h3 className="font-headline text-white text-xl sm:text-3xl lg:text-4xl leading-[1.05] tracking-tight line-clamp-4 text-balance">
                {lead.title}
              </h3>
            </div>
          </Link>
          {rest.slice(0, 2).map((p, i) => (
            <Link
              key={p.id}
              to={`/post/${p.slug}`}
              className={`group relative col-span-3 sm:col-span-2 overflow-hidden rounded-lg bg-muted ${
                i === 0 ? "" : ""
              }`}
            >
              <img
                src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                alt={p.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h4 className="font-headline text-sm sm:text-base text-white leading-snug line-clamp-3">
                  {p.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      ) : variant === "neon-glass" ? (
        // Modern glass + neon: glowing card grid
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl pointer-events-none" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative">
            {posts.slice(0, 6).map((p, i) => (
              <Link
                key={p.id}
                to={`/post/${p.slug}`}
                className="group glass-card rounded-xl p-3 hover:neon-glow transition-shadow duration-500"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg mb-3">
                  <img
                    src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                    alt={p.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {i === 0 && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider">
                      ✨ ট্রেন্ডিং
                    </span>
                  )}
                </div>
                {p.category && (
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                    {p.category.name}
                  </span>
                )}
                <h3 className="font-headline text-sm sm:text-base text-headline leading-snug line-clamp-3 mt-1 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      ) : variant === "polaroid" ? (
        // Tilted polaroid horizontal scroll
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-thin">
          <div className="flex gap-5 sm:gap-7 pb-6 pt-3 snap-x">
            {posts.map((p, i) => (
              <Link
                key={p.id}
                to={`/post/${p.slug}`}
                className={`snap-start flex-shrink-0 w-[60%] sm:w-[36%] lg:w-[22%] bg-card border border-border shadow-md hover:shadow-xl p-3 pb-4 transition-all hover:-translate-y-1 ${
                  i % 2 === 0 ? "rotate-[-1.5deg]" : "rotate-[1.5deg]"
                } hover:rotate-0`}
                style={{ borderRadius: "2px" }}
              >
                <div className="aspect-square overflow-hidden bg-muted mb-3">
                  <img
                    src={p.image_url || getPlaceholderImage(p.category?.slug, p.title)}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="font-headline text-sm text-headline leading-snug line-clamp-2 text-center px-1">
                  {p.title}
                </h3>
                {p.category && (
                  <p className="text-[10px] text-center text-muted-foreground italic mt-1">
                    — {p.category.name}
                  </p>
                )}
              </Link>
            ))}
          </div>
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
