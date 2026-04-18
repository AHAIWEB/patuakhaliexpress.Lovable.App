import PostCard, { PostCardData } from "@/components/PostCard";
import DivisionsTabs from "@/components/DivisionsTabs";
import SidebarWidget from "@/components/SidebarWidget";
import RenderSection, { type RenderableSection } from "@/components/home/RenderSection";

export interface HomeLayoutProps {
  lead: PostCardData | undefined;
  sideFeatured: PostCardData[];
  latest: PostCardData[];
  sections: RenderableSection[];
  showFeaturedBlock: boolean;
  showDivisionsTabs: boolean;
  showLatestSection: boolean;
  sentinelRef: React.MutableRefObject<HTMLDivElement | null>;
  latestLoading: boolean;
  siteName: string;
}

/* ============== HYBRID (default — your uploaded reference) ============== */
export const HybridLayout = (p: HomeLayoutProps) => (
  <>
    {p.showFeaturedBlock && p.lead && (
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PostCard post={p.lead} variant="lead" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {p.sideFeatured.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      </section>
    )}
    <div className="grid gap-8 lg:grid-cols-[1fr_300px] mt-2">
      <div className="min-w-0">
        {p.showDivisionsTabs && <DivisionsTabs />}
        {p.sections.map((s) => (
          <RenderSection key={s.id} section={s} />
        ))}
        {p.showLatestSection && p.latest.length > 0 && (
          <section className="py-6">
            <div className="section-rule">
              <h2 className="font-headline text-xl sm:text-2xl text-headline inline-flex items-center gap-2">
                <span className="inline-block w-1.5 h-6 bg-primary" />
                সর্বশেষ সংবাদ
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {p.latest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div ref={p.sentinelRef} className="h-10" />
            {p.latestLoading && (
              <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>
            )}
          </section>
        )}
      </div>
      <SidebarWidget />
    </div>
  </>
);

/* ============== MAGAZINE (large editorial hero, multi-column) ============== */
export const MagazineLayout = (p: HomeLayoutProps) => (
  <>
    {p.showFeaturedBlock && p.lead && (
      <section className="border-y-4 border-foreground py-6 mb-8">
        <div className="text-center mb-5">
          <span className="text-xs uppercase tracking-[0.3em] text-primary font-bold">
            শীর্ষ প্রতিবেদন
          </span>
        </div>
        <article className="max-w-4xl mx-auto text-center">
          {p.lead.image_url && (
            <div className="aspect-[21/9] overflow-hidden mb-6">
              <img src={p.lead.image_url} alt={p.lead.title} className="w-full h-full object-cover" />
            </div>
          )}
          <a href={`/post/${p.lead.slug}`}>
            <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl text-headline leading-[1.1] text-balance mb-4 hover:text-primary transition-colors">
              {p.lead.title}
            </h1>
          </a>
          {p.lead.excerpt && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {p.lead.excerpt}
            </p>
          )}
        </article>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8 pt-6 border-t border-border">
          {p.sideFeatured.slice(0, 4).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    )}
    {p.showDivisionsTabs && <DivisionsTabs />}
    {p.sections.map((s) => (
      <RenderSection key={s.id} section={s} />
    ))}
    {p.showLatestSection && p.latest.length > 0 && (
      <section className="py-8 grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <div className="border-b-2 border-foreground pb-2 mb-6">
            <h2 className="font-headline text-2xl sm:text-3xl text-headline">সর্বশেষ সংবাদ</h2>
          </div>
          <div className="space-y-6 columns-1 sm:columns-2 gap-6">
            {p.latest.map((post) => (
              <div key={post.id} className="break-inside-avoid mb-6">
                <PostCard post={post} variant="wide" />
              </div>
            ))}
          </div>
          <div ref={p.sentinelRef} className="h-10" />
          {p.latestLoading && <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>}
        </div>
        <SidebarWidget />
      </section>
    )}
  </>
);

/* ============== MINIMAL (white space, typography-first) ============== */
export const MinimalLayout = (p: HomeLayoutProps) => (
  <>
    {p.showFeaturedBlock && p.lead && (
      <section className="py-8 sm:py-12 max-w-5xl mx-auto">
        <a href={`/post/${p.lead.slug}`} className="block group">
          {p.lead.image_url && (
            <div className="aspect-[16/9] overflow-hidden bg-muted mb-8">
              <img
                src={p.lead.image_url}
                alt={p.lead.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            </div>
          )}
          {p.lead.category && (
            <div className="text-xs uppercase tracking-widest text-primary font-medium mb-3">
              {p.lead.category.name}
            </div>
          )}
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-headline leading-tight text-balance group-hover:text-primary transition-colors">
            {p.lead.title}
          </h1>
          {p.lead.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-3xl">
              {p.lead.excerpt}
            </p>
          )}
        </a>
        {p.sideFeatured.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-8 mt-12 pt-8 border-t border-border">
            {p.sideFeatured.slice(0, 3).map((post) => (
              <a key={post.id} href={`/post/${post.slug}`} className="group">
                {post.category && (
                  <div className="text-[10px] uppercase tracking-widest text-primary mb-2">
                    {post.category.name}
                  </div>
                )}
                <h3 className="font-headline text-base leading-snug text-headline group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
              </a>
            ))}
          </div>
        )}
      </section>
    )}
    {p.showDivisionsTabs && <DivisionsTabs />}
    {p.sections.map((s) => (
      <RenderSection key={s.id} section={s} />
    ))}
    {p.showLatestSection && p.latest.length > 0 && (
      <section className="py-12 max-w-5xl mx-auto">
        <h2 className="font-headline text-2xl text-headline mb-8 text-center">— সর্বশেষ —</h2>
        <div className="space-y-8 divide-y divide-border">
          {p.latest.map((post) => (
            <div key={post.id} className="pt-8 first:pt-0">
              <PostCard post={post} variant="wide" />
            </div>
          ))}
        </div>
        <div ref={p.sentinelRef} className="h-10" />
        {p.latestLoading && <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>}
      </section>
    )}
  </>
);

/* ============== BOLD (dark, large type, asymmetric grid) ============== */
export const BoldLayout = (p: HomeLayoutProps) => (
  <>
    {p.showFeaturedBlock && p.lead && (
      <section className="grid lg:grid-cols-5 gap-4 mb-6">
        <a
          href={`/post/${p.lead.slug}`}
          className="lg:col-span-3 relative group overflow-hidden rounded-lg bg-card aspect-[16/10] lg:aspect-auto lg:min-h-[480px]"
        >
          {p.lead.image_url && (
            <img
              src={p.lead.image_url}
              alt={p.lead.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
            {p.lead.category && (
              <span className="inline-block self-start bg-accent text-background text-xs font-bold px-3 py-1 mb-3 uppercase tracking-wider rounded">
                {p.lead.category.name}
              </span>
            )}
            <h1 className="font-headline text-2xl sm:text-4xl lg:text-5xl text-foreground leading-[1.05] text-balance group-hover:text-accent transition-colors">
              {p.lead.title}
            </h1>
          </div>
        </a>
        <div className="lg:col-span-2 grid gap-4 grid-cols-2 lg:grid-cols-1">
          {p.sideFeatured.slice(0, 3).map((post) => (
            <a
              key={post.id}
              href={`/post/${post.slug}`}
              className="group relative overflow-hidden rounded-lg bg-card aspect-[16/10] lg:aspect-[16/9]"
            >
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute inset-0 p-3 sm:p-4 flex items-end">
                <h3 className="font-headline text-sm sm:text-base text-foreground leading-tight group-hover:text-accent transition-colors line-clamp-3">
                  {post.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </section>
    )}
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {p.showDivisionsTabs && <DivisionsTabs />}
        {p.sections.map((s) => (
          <RenderSection key={s.id} section={s} />
        ))}
        {p.showLatestSection && p.latest.length > 0 && (
          <section className="py-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-headline text-2xl sm:text-3xl text-headline">
                সর্বশেষ
              </h2>
              <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-accent to-transparent rounded" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.latest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div ref={p.sentinelRef} className="h-10" />
            {p.latestLoading && (
              <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>
            )}
          </section>
        )}
      </div>
      <SidebarWidget />
    </div>
  </>
);

/* ============== MASONRY (Pinterest-style card grid) ============== */
export const MasonryLayout = (p: HomeLayoutProps) => {
  const all = [
    ...(p.lead ? [p.lead] : []),
    ...p.sideFeatured,
    ...p.sections.flatMap((s) => s.posts),
    ...p.latest,
  ];
  const seen = new Set<string>();
  const items = all.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));

  return (
    <>
      {p.showDivisionsTabs && <DivisionsTabs />}
      <section className="py-4">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {items.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-4">
              <PostCard post={post} />
            </div>
          ))}
        </div>
        <div ref={p.sentinelRef} className="h-10" />
        {p.latestLoading && (
          <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>
        )}
      </section>
    </>
  );
};

/* ============== CLASSIC NEWSPAPER (serif, multi-column, ruled) ============== */
export const ClassicLayout = (p: HomeLayoutProps) => (
  <>
    {p.showFeaturedBlock && p.lead && (
      <section className="border-y-[3px] border-double border-foreground py-5 mb-6">
        <div className="text-center mb-4">
          <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/70">
            — মুখ্য সংবাদ —
          </span>
        </div>
        <article className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
          <div>
            {p.lead.image_url && (
              <div className="aspect-[16/9] overflow-hidden mb-4 border border-border">
                <img src={p.lead.image_url} alt={p.lead.title} className="w-full h-full object-cover" />
              </div>
            )}
            <a href={`/post/${p.lead.slug}`}>
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-headline leading-[1.15] text-balance hover:underline decoration-primary decoration-2 underline-offset-4">
                {p.lead.title}
              </h1>
            </a>
            {p.lead.excerpt && (
              <p className="mt-3 text-base text-foreground/80 leading-relaxed columns-1 sm:columns-2 gap-6 first-letter:text-5xl first-letter:font-headline first-letter:float-left first-letter:mr-2 first-letter:leading-[0.9]">
                {p.lead.excerpt}
              </p>
            )}
          </div>
          <aside className="border-l border-border pl-5 space-y-4 divide-y divide-border">
            {p.sideFeatured.slice(0, 4).map((post) => (
              <a key={post.id} href={`/post/${post.slug}`} className="block pt-4 first:pt-0 group">
                {post.category && (
                  <div className="text-[10px] uppercase tracking-widest text-primary mb-1">
                    {post.category.name}
                  </div>
                )}
                <h3 className="font-headline text-base text-headline leading-snug group-hover:underline">
                  {post.title}
                </h3>
              </a>
            ))}
          </aside>
        </article>
      </section>
    )}
    {p.showDivisionsTabs && <DivisionsTabs />}
    {p.sections.map((s) => (
      <RenderSection key={s.id} section={s} />
    ))}
    {p.showLatestSection && p.latest.length > 0 && (
      <section className="py-8 grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="border-b-[3px] border-double border-foreground pb-2 mb-5">
            <h2 className="font-headline text-2xl sm:text-3xl text-headline">সর্বশেষ সংবাদ</h2>
          </div>
          <div className="columns-1 md:columns-2 gap-6">
            {p.latest.map((post) => (
              <div key={post.id} className="break-inside-avoid mb-6">
                <PostCard post={post} variant="wide" />
              </div>
            ))}
          </div>
          <div ref={p.sentinelRef} className="h-10" />
          {p.latestLoading && <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>}
        </div>
        <SidebarWidget />
      </section>
    )}
  </>
);

/* ============== PROTHOM (Bengali daily — red accents, mixed grid + sidebar list) ============== */
export const ProthomLayout = (p: HomeLayoutProps) => (
  <>
    {p.showFeaturedBlock && p.lead && (
      <section className="grid lg:grid-cols-[1.6fr_1fr] gap-5 mb-6">
        {/* Left: lead + 2 medium photos */}
        <div className="space-y-4">
          <a href={`/post/${p.lead.slug}`} className="group block">
            {p.lead.image_url && (
              <div className="aspect-[16/9] overflow-hidden rounded-md bg-muted">
                <img
                  src={p.lead.image_url}
                  alt={p.lead.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            )}
            <h1 className="font-headline text-xl sm:text-2xl lg:text-3xl text-headline mt-3 leading-tight text-balance group-hover:text-primary transition-colors">
              {p.lead.title}
            </h1>
            {p.lead.category && (
              <span className="inline-block mt-2 text-xs text-primary font-semibold border-l-2 border-primary pl-2">
                {p.lead.category.name}
              </span>
            )}
          </a>
          {p.sideFeatured.slice(0, 2).length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-border">
              {p.sideFeatured.slice(0, 2).map((post) => (
                <a key={post.id} href={`/post/${post.slug}`} className="group block">
                  {post.image_url && (
                    <div className="aspect-[16/10] overflow-hidden rounded-md bg-muted mb-2">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="font-headline text-sm sm:text-base text-headline leading-snug group-hover:text-primary transition-colors line-clamp-3">
                    {post.title}
                  </h3>
                  {post.category && (
                    <span className="inline-block mt-1.5 text-[11px] text-primary border-l-2 border-primary pl-1.5">
                      {post.category.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right: vertical thumb-list (Prothom Alo right rail) */}
        <aside className="divide-y divide-border border border-border rounded-md bg-card">
          {p.sideFeatured.slice(2, 8).map((post) => (
            <a
              key={post.id}
              href={`/post/${post.slug}`}
              className="group flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-sm leading-snug text-headline group-hover:text-primary transition-colors line-clamp-3">
                  {post.title}
                </h3>
                {post.category && (
                  <span className="inline-block mt-1.5 text-[11px] text-primary border-l-2 border-primary pl-1.5">
                    {post.category.name}
                  </span>
                )}
              </div>
              {post.image_url && (
                <div className="w-20 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </a>
          ))}
        </aside>
      </section>
    )}

    <div className="grid gap-8 lg:grid-cols-[1fr_300px] mt-2">
      <div className="min-w-0">
        {p.showDivisionsTabs && <DivisionsTabs />}
        {p.sections.map((s) => (
          <RenderSection key={s.id} section={s} />
        ))}
        {p.showLatestSection && p.latest.length > 0 && (
          <section className="py-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-foreground/15">
              <h2 className="font-headline text-lg sm:text-xl text-primary font-bold">
                সর্বশেষ সংবাদ
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {p.latest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div ref={p.sentinelRef} className="h-10" />
            {p.latestLoading && (
              <p className="text-center text-muted-foreground mt-4">লোড হচ্ছে...</p>
            )}
          </section>
        )}
      </div>
      <SidebarWidget />
    </div>
  </>
);
