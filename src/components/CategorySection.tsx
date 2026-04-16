import { Link } from "react-router-dom";
import PostCard, { PostCardData } from "./PostCard";

interface Props {
  title: string;
  slug: string;
  posts: PostCardData[];
}

const CategorySection = ({ title, slug, posts }: Props) => {
  if (!posts.length) return null;
  const [lead, ...rest] = posts;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 border-b-2 border-primary pb-2">
        <h2 className="font-headline text-xl sm:text-2xl text-headline">
          <Link to={`/category/${slug}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </h2>
        <Link
          to={`/category/${slug}`}
          className="text-xs text-primary font-semibold hover:underline"
        >
          সব দেখুন →
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2 lg:row-span-2">
          <PostCard post={lead} variant="lead" />
        </div>
        {rest.slice(0, 4).map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
