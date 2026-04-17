import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PostCard, { PostCardData } from "./PostCard";

interface Props {
  title: string;
  slug: string;
  posts: PostCardData[];
  variant?: "grid" | "list" | "hero";
}

const CategorySection = ({ title, slug, posts, variant = "grid" }: Props) => {
  if (!posts.length) return null;
  const [lead, ...rest] = posts;
  const href = slug ? `/category/${slug}` : "#";

  return (
    <section className="py-6">
      <div className="section-rule">
        <h2 className="font-headline text-xl sm:text-2xl text-headline">
          <Link to={href} className="hover:text-primary transition-colors inline-flex items-center gap-2">
            <span className="inline-block w-1.5 h-6 bg-primary" />
            {title}
          </Link>
        </h2>
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
