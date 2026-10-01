create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.grant_owner_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) = 'sajadnazar928@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created_grant_admin after insert on auth.users
for each row execute function public.grant_owner_admin();
create trigger on_auth_user_confirmed_grant_admin after update of email_confirmed_at on auth.users
for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.grant_owner_admin();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  image_url text,
  link text,
  category_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.custom_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.categories, public.projects, public.custom_sections to anon, authenticated;
grant insert, update, delete on public.categories, public.projects, public.custom_sections to authenticated;
grant all on public.categories, public.projects, public.custom_sections to service_role;

alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.custom_sections enable row level security;

create policy "Public read categories" on public.categories for select to anon, authenticated using (true);
create policy "Admin write categories" on public.categories for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Public read projects" on public.projects for select to anon, authenticated using (true);
create policy "Admin write projects" on public.projects for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Public read sections" on public.custom_sections for select to anon, authenticated using (true);
create policy "Admin write sections" on public.custom_sections for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Admin upload portfolio images" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin update portfolio images" on storage.objects for update to authenticated using (bucket_id = 'portfolio-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin delete portfolio images" on storage.objects for delete to authenticated using (bucket_id = 'portfolio-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admin read portfolio images" on storage.objects for select to authenticated using (bucket_id = 'portfolio-images' and public.has_role(auth.uid(), 'admin'));

insert into public.projects (title, description, tags, image_url, sort_order) values
('CryptoExplorer Website', 'An educational website about cryptocurrencies that introduces blockchain technology, showcases the top 10 digital currencies, and provides trusted resources for tracking prices.', array['React','API','Charts'], 'builtin:crypto', 1),
('Social Dashboard', 'A dashboard showing social media stats and analytics in real-time with clean data visualizations.', array['React','Analytics'], 'builtin:social', 2),
('Task Manager', 'Manage daily tasks, deadlines, and priorities with a clean, focused interface.', array['TypeScript','UI'], 'builtin:tasks', 3),
('Weather App', 'Check real-time weather conditions with animated icons and multi-day forecasts.', array['API','Animation'], 'builtin:weather', 4),
('Portfolio', 'A personal portfolio website to showcase projects and skills elegantly.', array['Design','Motion'], 'builtin:portfolio', 5),
('Game Website', 'Interactive web-based games with fun animations and score tracking.', array['JavaScript','Canvas'], 'builtin:game', 6);