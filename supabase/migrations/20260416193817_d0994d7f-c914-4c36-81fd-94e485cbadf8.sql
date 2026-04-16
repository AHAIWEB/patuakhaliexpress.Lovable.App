-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');
CREATE TYPE public.post_type AS ENUM ('auto', 'manual');
CREATE TYPE public.scraper_method AS ENUM ('rss', 'firecrawl');

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  show_in_menu BOOLEAN NOT NULL DEFAULT TRUE,
  hide_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sources
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sources_updated BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scraper configs
CREATE TABLE public.scraper_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  method public.scraper_method NOT NULL DEFAULT 'firecrawl',
  interval_minutes INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_scraper_configs_updated BEFORE UPDATE ON public.scraper_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  source_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  post_type public.post_type NOT NULL DEFAULT 'auto',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_category ON public.posts(category_id);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_source_url ON public.posts(source_url);
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Photocards
CREATE TABLE public.photocards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT,
  quote TEXT,
  image_url TEXT,
  card_size TEXT NOT NULL DEFAULT 'square',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photocards ENABLE ROW LEVEL SECURITY;

-- ===== RLS Policies =====
-- Profiles: own read/update, public read of display info
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles: only admins manage; users can read their own
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories: public read, admin write
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sources: public read, admin write
CREATE POLICY "Sources public read" ON public.sources FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage sources" ON public.sources FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Scraper configs: admin only
CREATE POLICY "Admins read scrapers" ON public.scraper_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage scrapers" ON public.scraper_configs FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Posts: public read of published, admin manage
CREATE POLICY "Posts public read" ON public.posts FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins read all posts" ON public.posts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage posts" ON public.posts FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Photocards: public read, anyone authenticated can create
CREATE POLICY "Photocards public read" ON public.photocards FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated create photocards" ON public.photocards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage photocards" ON public.photocards FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (name, slug, display_order) VALUES
  ('জাতীয়', 'national', 1),
  ('রাজনীতি', 'politics', 2),
  ('আন্তর্জাতিক', 'international', 3),
  ('অর্থনীতি', 'economy', 4),
  ('খেলা', 'sports', 5),
  ('বিনোদন', 'entertainment', 6),
  ('চট্টগ্রাম', 'chattogram', 7),
  ('বরিশাল', 'barishal', 8),
  ('ঢাকা', 'dhaka', 9),
  ('খুলনা', 'khulna', 10),
  ('সিলেট', 'sylhet', 11),
  ('রাজশাহী', 'rajshahi', 12),
  ('রংপুর', 'rangpur', 13),
  ('ময়মনসিংহ', 'mymensingh', 14),
  ('গ্যালারি', 'gallery', 15);

-- Seed sources
INSERT INTO public.sources (name, base_url) VALUES
  ('যুগান্তর', 'https://www.jugantor.com'),
  ('প্রথম আলো', 'https://www.prothomalo.com'),
  ('NTV', 'https://www.ntvbd.com'),
  ('Risingbd', 'https://www.risingbd.com');