-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- First account ever created becomes the administrator (signups are disabled; accounts are added by the owner)
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  resource_type text NOT NULL CHECK (resource_type IN ('video', 'site', 'application', 'all')),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active categories" ON public.categories FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Video platforms
CREATE TABLE public.video_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 60),
  logo_url text,
  is_custom boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_platforms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_platforms TO authenticated;
GRANT ALL ON public.video_platforms TO service_role;
ALTER TABLE public.video_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active platforms" ON public.video_platforms FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert platforms" ON public.video_platforms FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update platforms" ON public.video_platforms FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete platforms" ON public.video_platforms FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER platforms_touch BEFORE UPDATE ON public.video_platforms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Videos
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  url text NOT NULL CHECK (url ~* '^https?://'),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  platform_id uuid REFERENCES public.video_platforms(id) ON DELETE SET NULL,
  custom_platform_name text CHECK (custom_platform_name IS NULL OR char_length(custom_platform_name) <= 60),
  image_source text CHECK (image_source IS NULL OR image_source IN ('url', 'upload')),
  image_original_url text,
  image_url text,
  image_path text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sites
CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  url text NOT NULL CHECK (url ~* '^https?://'),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_source text CHECK (image_source IS NULL OR image_source IN ('url', 'upload')),
  image_original_url text,
  image_url text,
  image_path text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Applications
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  url text NOT NULL CHECK (url ~* '^https?://'),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  app_platform text NOT NULL DEFAULT 'Web' CHECK (app_platform IN ('Windows', 'macOS', 'Linux', 'Android', 'iOS', 'Web', 'Cross-platform')),
  image_source text CHECK (image_source IS NULL OR image_source IN ('url', 'upload')),
  image_original_url text,
  image_url text,
  image_path text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['videos', 'sites', 'applications'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Public reads published %1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Admins delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE TRIGGER %1$s_touch BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t);
    EXECUTE format('CREATE INDEX %1$s_published_created_idx ON public.%1$I (is_published, created_at DESC)', t);
    EXECUTE format('CREATE INDEX %1$s_category_idx ON public.%1$I (category_id)', t);
  END LOOP;
END $$;
CREATE INDEX videos_platform_idx ON public.videos (platform_id);

-- Site settings / branding (single row)
CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'TheBull' CHECK (char_length(site_name) BETWEEN 1 AND 60),
  tagline text NOT NULL DEFAULT 'Discover Videos, Websites & Applications',
  site_description text NOT NULL DEFAULT 'TheBull is a curated platform for discovering the best videos, websites and applications — hand-picked and organized so you can find what matters, fast.',
  logo_mode text NOT NULL DEFAULT 'default' CHECK (logo_mode IN ('default', 'url', 'upload', 'none')),
  logo_original_url text,
  logo_url text,
  logo_path text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES (1);

-- Seed platforms
INSERT INTO public.video_platforms (name, is_custom) VALUES
  ('YouTube', false), ('Vimeo', false), ('Instagram', false), ('Facebook', false), ('TikTok', false),
  ('Dailymotion', false), ('Twitch', false), ('Other', true), ('Custom Video URL', true);

-- Seed starter categories
INSERT INTO public.categories (name, description, resource_type) VALUES
  ('Education', 'Lessons, lectures and explainers', 'video'),
  ('Technology', 'Tech reviews, talks and tutorials', 'video'),
  ('Entertainment', 'Music, shows and creative work', 'video'),
  ('Productivity', 'Tools that help you get more done', 'site'),
  ('Design', 'Inspiration and resources for designers', 'site'),
  ('Learning', 'Courses and knowledge hubs', 'site'),
  ('Developer Tools', 'Editors, terminals and builder tools', 'application'),
  ('Communication', 'Messaging and collaboration apps', 'application'),
  ('Utilities', 'Everyday helpers for your devices', 'application');

-- Seed sample resources
INSERT INTO public.videos (title, url, description, category_id, platform_id, is_featured, is_published)
SELECT 'TED Talks Channel', 'https://www.youtube.com/@TED', 'Ideas worth spreading — thousands of talks from the world''s leading thinkers.',
  (SELECT id FROM public.categories WHERE name = 'Education'), (SELECT id FROM public.video_platforms WHERE name = 'YouTube'), true, true;
INSERT INTO public.videos (title, url, description, category_id, platform_id, is_featured, is_published)
SELECT 'Vimeo Staff Picks', 'https://vimeo.com/channels/staffpicks', 'Hand-picked short films and creative work selected by the Vimeo curation team.',
  (SELECT id FROM public.categories WHERE name = 'Entertainment'), (SELECT id FROM public.video_platforms WHERE name = 'Vimeo'), true, true;
INSERT INTO public.videos (title, url, description, category_id, platform_id, is_featured, is_published)
SELECT 'Twitch Science & Technology', 'https://www.twitch.tv/directory/category/science-and-technology', 'Live streams covering engineering, coding and science experiments.',
  (SELECT id FROM public.categories WHERE name = 'Technology'), (SELECT id FROM public.video_platforms WHERE name = 'Twitch'), false, true;

INSERT INTO public.sites (title, url, description, category_id, is_featured, is_published)
SELECT 'Notion', 'https://www.notion.so', 'An all-in-one workspace for notes, docs, wikis and project planning.', (SELECT id FROM public.categories WHERE name = 'Productivity'), true, true;
INSERT INTO public.sites (title, url, description, category_id, is_featured, is_published)
SELECT 'Dribbble', 'https://dribbble.com', 'Discover work from the world''s top designers and creative professionals.', (SELECT id FROM public.categories WHERE name = 'Design'), true, true;
INSERT INTO public.sites (title, url, description, category_id, is_featured, is_published)
SELECT 'Khan Academy', 'https://www.khanacademy.org', 'Free, world-class lessons in math, science, computing and more.', (SELECT id FROM public.categories WHERE name = 'Learning'), false, true;

INSERT INTO public.applications (title, url, description, category_id, app_platform, is_featured, is_published)
SELECT 'Visual Studio Code', 'https://code.visualstudio.com', 'A fast, free code editor with thousands of extensions.', (SELECT id FROM public.categories WHERE name = 'Developer Tools'), 'Cross-platform', true, true;
INSERT INTO public.applications (title, url, description, category_id, app_platform, is_featured, is_published)
SELECT 'Signal', 'https://signal.org/download/', 'Private messaging with end-to-end encryption on every conversation.', (SELECT id FROM public.categories WHERE name = 'Communication'), 'Cross-platform', true, true;
INSERT INTO public.applications (title, url, description, category_id, app_platform, is_featured, is_published)
SELECT 'PowerToys', 'https://learn.microsoft.com/windows/powertoys/', 'Power-user utilities to tune and streamline your Windows experience.', (SELECT id FROM public.categories WHERE name = 'Utilities'), 'Windows', false, true;