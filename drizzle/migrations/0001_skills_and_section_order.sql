CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'code',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skills" ON public.skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write skills" ON public.skills FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.section_order (
  key text PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.section_order TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_order TO authenticated;
GRANT ALL ON public.section_order TO service_role;
ALTER TABLE public.section_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read section order" ON public.section_order FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write section order" ON public.section_order FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.section_order (key, sort_order) VALUES ('about', 10), ('skill', 20), ('project', 30), ('contact', 1000);
UPDATE public.custom_sections SET sort_order = 100 + sort_order WHERE sort_order < 100;

INSERT INTO public.skills (label, icon, sort_order) VALUES
('HTML5','code',1),('CSS3','palette',2),('JavaScript','braces',3),('TypeScript','file-code',4),('React','atom',5),('Routing','router',6),('VLANs','network',7),('TCP/IP','cable',8),('MySQL','database',9),('Cisco IOS','wifi',10),('Network Security','shield',11),('GitHub','git',12);