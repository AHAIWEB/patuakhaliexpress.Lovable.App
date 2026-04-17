CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  primary_hue NUMERIC NOT NULL DEFAULT 354,
  primary_saturation NUMERIC NOT NULL DEFAULT 78,
  primary_lightness NUMERIC NOT NULL DEFAULT 46,
  accent_hue NUMERIC NOT NULL DEFAULT 38,
  accent_saturation NUMERIC NOT NULL DEFAULT 92,
  accent_lightness NUMERIC NOT NULL DEFAULT 50,
  headline_font TEXT NOT NULL DEFAULT 'Noto Serif Bengali',
  body_font TEXT NOT NULL DEFAULT 'Hind Siliguri',
  base_font_size INTEGER NOT NULL DEFAULT 16,
  headline_weight INTEGER NOT NULL DEFAULT 700,
  show_breaking_ticker BOOLEAN NOT NULL DEFAULT true,
  show_hero_block BOOLEAN NOT NULL DEFAULT true,
  show_divisions_tabs BOOLEAN NOT NULL DEFAULT true,
  show_latest_section BOOLEAN NOT NULL DEFAULT true,
  site_name TEXT NOT NULL DEFAULT 'পটুয়াখালী এক্সপ্রেস',
  site_description TEXT NOT NULL DEFAULT 'সর্বশেষ বাংলা সংবাদ এক জায়গায়।',
  og_image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();