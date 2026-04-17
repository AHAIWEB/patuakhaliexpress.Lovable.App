import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlaceholderImage } from "@/lib/placeholder";

export interface PostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  image_url?: string | null;
  published_at: string;
  category?: { name: string; slug: string } | null;
  source?: { name: string; logo_url?: string | null } | null;
}

interface Props {
  post: PostCardData;
  variant?: "lead" | "default" | "compact" | "wide";
}

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("bn-BD", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Read current theme from <html data-theme="..."> so cards adapt automatically
const useThemeKey = () => {
  const [key, setKey] = useState<string>(() =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") ?? "hybrid"
      : "hybrid",
  );
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() =>
      setKey(root.getAttribute("data-theme") ?? "hybrid"),
    );
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return key;
};

// Per-theme card shell classes — applied to the default variant
const cardShellFor = (theme: string) => {
  switch (theme) {
    case "magazine":
      // flat, sharp, strong serif — borderless top, thin bottom rule
      return "bg-card border-b-2 border-foreground/80 rounded-none shadow-none hover:opacity-90 transition-opacity";
    case "minimal":
      // borderless, lots of whitespace, no shadow
      return "bg-transparent rounded-none shadow-none hover:opacity-80 transition-opacity";
    case "bold":
      // elevated dark cards, glow on hover
      return "bg-card rounded-lg shadow-lg hover:shadow-[0_8px_30px_hsl(var(--accent)/0.35)] hover:-translate-y-0.5 transition-all";
    case "masonry":
      // pillowy rounded cards with soft shadow (Pinterest)
      return "bg-card rounded-2xl shadow-sm hover:shadow-xl transition-shadow ring-1 ring-border/60";
    case "classic":
      // sharp, ruled, no shadow
      return "bg-card rounded-none border border-border hover:border-foreground transition-colors";
    case "hybrid":
    default:
      return "bg-card card-elevate rounded-sm";
  }
};

const imageRoundFor = (theme: string) => {
  if (theme === "masonry") return "rounded-t-2xl";
  if (theme === "bold") return "rounded-t-lg";
  return "";
};

const PostCard = ({ post, variant = "default" }: Props) => {
  const href = `/post/${post.slug}`;
  const theme = useThemeKey();

  if (variant === "lead") {
    return (
      <article className="group relative overflow-hidden shadow-lead">
        <Link to={href} className="block">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-muted">
            <img
              src={post.image_url || getPlaceholderImage(post.category?.slug, post.title)}
              alt={post.title}
              loading="eager"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(post.category?.slug, post.title); }}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 gradient-overlay" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              {post.category && (
                <span className="category-tag mb-2.5 sm:mb-3">{post.category.name}</span>
              )}
              <h2 className="font-headline text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight text-balance group-hover:text-[hsl(var(--primary-glow))] transition-colors">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 sm:mt-3 text-sm sm:text-base opacity-90 line-clamp-2 hidden sm:block">
                  {post.excerpt}
                </p>
              )}
              <div className="text-xs opacity-75 mt-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {formatTime(post.published_at)}
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group">
        <Link to={href} className="flex gap-3 items-start">
          <div className={`flex-shrink-0 w-24 sm:w-28 aspect-[4/3] bg-muted overflow-hidden ${theme === "masonry" ? "rounded-xl" : "rounded-sm"}`}>
            <img
              src={post.image_url || getPlaceholderImage(post.category?.slug, post.title)}
              alt={post.title}
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(post.category?.slug, post.title); }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-headline text-sm sm:text-[0.95rem] leading-snug text-headline group-hover:text-primary line-clamp-3 transition-colors">
              {post.title}
            </h3>
            <div className="text-xs text-meta mt-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(post.published_at)}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "wide") {
    return (
      <article className="group grid sm:grid-cols-[1fr_2fr] gap-4 pb-5 border-b border-border last:border-0">
        <Link to={href} className={`block aspect-[16/10] overflow-hidden bg-muted ${theme === "masonry" ? "rounded-xl" : "rounded-sm"}`}>
          <img
            src={post.image_url || getPlaceholderImage(post.category?.slug, post.title)}
            alt={post.title}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(post.category?.slug, post.title); }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div>
          {post.category && (
            <Link to={`/category/${post.category.slug}`} className="category-tag mb-2">
              {post.category.name}
            </Link>
          )}
          <Link to={href}>
            <h3 className={`font-headline ${theme === "classic" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"} text-headline group-hover:text-primary leading-snug transition-colors text-balance`}>
              {post.title}
            </h3>
          </Link>
          {post.excerpt && (
            <p className={`text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed ${theme === "classic" ? "first-letter:text-3xl first-letter:font-headline first-letter:float-left first-letter:mr-1.5 first-letter:leading-none" : ""}`}>
              {post.excerpt}
            </p>
          )}
          <div className="text-xs text-meta mt-2.5 flex items-center gap-2">
            {post.source?.name && <span className="font-medium">{post.source.name}</span>}
            {post.source?.name && <span className="text-border">•</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(post.published_at)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`group overflow-hidden ${cardShellFor(theme)}`}>
      <Link to={href} className="block">
        <div className={`aspect-[16/10] overflow-hidden bg-muted relative ${imageRoundFor(theme)}`}>
          <img
            src={post.image_url || getPlaceholderImage(post.category?.slug, post.title)}
            alt={post.title}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = getPlaceholderImage(post.category?.slug, post.title); }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {post.category && (
            <span className="absolute top-2 left-2 category-tag text-[10px] py-0.5">
              {post.category.name}
            </span>
          )}
        </div>
        <div className={theme === "minimal" ? "py-3" : "p-3"}>
          <h3 className={`font-headline ${theme === "classic" ? "text-[1.05rem]" : "text-base"} leading-snug text-headline group-hover:text-primary line-clamp-3 transition-colors text-balance`}>
            {post.title}
          </h3>
          <div className="text-xs text-meta mt-2 flex items-center gap-2">
            {post.source?.name && <span className="font-medium">{post.source.name}</span>}
            {post.source?.name && <span className="text-border">•</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(post.published_at)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default PostCard;
