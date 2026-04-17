-- Post views tracking
CREATE TABLE public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visitor_hash TEXT
);
CREATE INDEX idx_post_views_post_time ON public.post_views(post_id, viewed_at DESC);
CREATE INDEX idx_post_views_time ON public.post_views(viewed_at DESC);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone insert post views"
ON public.post_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone read post views"
ON public.post_views FOR SELECT
USING (true);

-- Add category_id to photocards
ALTER TABLE public.photocards ADD COLUMN category_id UUID;
CREATE INDEX idx_photocards_category ON public.photocards(category_id);

-- Function: most read posts in last N days
CREATE OR REPLACE FUNCTION public.get_popular_posts(_days INT DEFAULT 7, _limit INT DEFAULT 6)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  view_count BIGINT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.title, p.slug, p.image_url, p.published_at, COUNT(v.id) AS view_count
  FROM public.posts p
  JOIN public.post_views v ON v.post_id = p.id
  WHERE p.is_published = true
    AND v.viewed_at >= now() - (_days || ' days')::interval
  GROUP BY p.id
  ORDER BY view_count DESC, p.published_at DESC
  LIMIT _limit;
$$;

-- Function: get total views for a post
CREATE OR REPLACE FUNCTION public.get_post_view_count(_post_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.post_views WHERE post_id = _post_id;
$$;

-- Make all existing home_sections visible
UPDATE public.home_sections SET is_visible = true WHERE is_visible = false;