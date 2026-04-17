ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS home_theme text NOT NULL DEFAULT 'hybrid';

COMMENT ON COLUMN public.site_settings.home_theme IS 'Selected home page theme: hybrid | magazine | minimal | bold';