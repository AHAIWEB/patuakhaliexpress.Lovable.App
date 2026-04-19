import CategorySection from "@/components/CategorySection";
import TabsSection from "@/components/TabsSection";
import type { PostCardData } from "@/components/PostCard";
import type { SectionVariant } from "@/components/CategorySection";

export interface RenderableSection {
  id: string;
  title: string;
  slug: string;
  posts: PostCardData[];
  variant: SectionVariant | "tabs";
  config?: {
    bg_style?: "none" | "muted" | "accent-tint" | "dark" | "primary-tint";
    tab_category_ids?: string[];
    icon?: string | null;
    accent_color?: string | null;
  } | null;
  item_count?: number;
}

const wrapperFor = (style?: string) => {
  switch (style) {
    case "muted":
      return "bg-muted/50 -mx-4 sm:-mx-6 px-4 sm:px-6 my-2";
    case "accent-tint":
      return "bg-accent/10 border-y border-accent/20 -mx-4 sm:-mx-6 px-4 sm:px-6 my-2";
    case "primary-tint":
      return "bg-primary/5 border-y border-primary/15 -mx-4 sm:-mx-6 px-4 sm:px-6 my-2";
    case "dark":
      return "bg-foreground text-background -mx-4 sm:-mx-6 px-4 sm:px-6 my-2 [&_.text-headline]:text-background [&_.text-muted-foreground]:text-background/70";
    default:
      return "";
  }
};

const RenderSection = ({ section }: { section: RenderableSection }) => {
  const wrapper = wrapperFor(section.config?.bg_style);
  const inner =
    section.variant === "tabs" ? (
      <TabsSection
        title={section.title}
        categoryIds={section.config?.tab_category_ids ?? []}
        itemCount={section.item_count ?? 6}
      />
    ) : (
      <CategorySection
        title={section.title}
        slug={section.slug}
        posts={section.posts}
        variant={section.variant as SectionVariant}
        icon={section.config?.icon ?? null}
        accentColor={section.config?.accent_color ?? null}
      />
    );
  if (!wrapper) return inner;
  return <div className={wrapper}>{inner}</div>;
};

export default RenderSection;
