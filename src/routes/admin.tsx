import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { ArrowDown, ArrowLeft, ArrowUp, LogOut, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { SKILL_ICONS, skillIcon } from "@/lib/skill-icons";
import { supabase } from "@/integrations/supabase/client";
import {
  portfolioQuery,
  resolveImage,
  uploadImage,
  type Category,
  type CustomSection,
  type Project,
  type Skill,
  orderedSections,
} from "@/lib/portfolio";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Sajad Nazar Portfolio" },
      { name: "description", content: "Manage projects, categories and sections of the portfolio." },
      { property: "og:title", content: "Admin — Sajad Nazar Portfolio" },
      { property: "og:description", content: "Private dashboard for managing portfolio content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60";
const btnPrimary = `${btn} bg-foreground text-background hover:bg-accent hover:text-accent-foreground`;
const btnGhost = `${btn} border border-border hover:border-accent`;

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: session.user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
            <ArrowLeft className="size-4" /> Back to site
          </Link>
          {session && (
            <button className={btnGhost} onClick={() => supabase.auth.signOut()}>
              <LogOut className="size-4" /> Sign out
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Admin <span className="text-accent">Dashboard</span>
        </h1>
        {!ready ? null : !session ? (
          <LoginForm />
        ) : isAdmin === null ? (
          <p className="mt-8 text-muted-foreground">Checking access...</p>
        ) : !isAdmin ? (
          <p className="mt-8 text-destructive">
            This account doesn't have admin access. Sign in with sajadnazar928@gmail.com.
          </p>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ ok: false, text: error.message });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setMsg(
        error
          ? { ok: false, text: error.message }
          : { ok: true, text: "Check your email to confirm your account, then sign in." },
      );
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-8 max-w-sm space-y-4 rounded-2xl border border-border bg-card/60 p-6">
      <h2 className="text-lg font-semibold">{mode === "in" ? "Sign in" : "Create admin account"}</h2>
      <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className={`${btnPrimary} w-full`} disabled={busy}>
        {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
      </button>
      {msg && <p className={`text-sm ${msg.ok ? "text-accent" : "text-destructive"}`}>{msg.text}</p>}
      <button type="button" className="text-sm text-muted-foreground hover:text-accent" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "First time? Create your account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<"projects" | "categories" | "sections" | "skills" | "order">("projects");
  const { data, isLoading } = useQuery(portfolioQuery);
  const tabs = [
    ["projects", "Projects"],
    ["categories", "Categories"],
    ["sections", "Sections"],
    ["skills", "Skills"],
    ["order", "Section order"],
  ] as const;
  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? btnPrimary : btnGhost}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {isLoading || !data ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : tab === "projects" ? (
          <ProjectsAdmin projects={data.projects} categories={data.categories} />
        ) : tab === "categories" ? (
          <CategoriesAdmin categories={data.categories} />
        ) : tab === "skills" ? (
          <SkillsAdmin skills={data.skills} />
        ) : tab === "order" ? (
          <OrderAdmin data={data} />
        ) : (
          <SectionsAdmin sections={data.sections} />
        )}
      </div>
    </div>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["portfolio"] });
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5">{children}</div>;
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const preview = resolveImage(value);
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Image</label>
      {preview && <img src={preview} alt="" className="h-32 w-full rounded-lg border border-border object-cover sm:w-56" />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className={input} placeholder="Paste image URL, or upload" value={value.startsWith("builtin:") ? "" : value} onChange={(e) => onChange(e.target.value)} />
        <label className={`${btnGhost} cursor-pointer whitespace-nowrap`}>
          <Upload className="size-4" /> {busy ? "Uploading..." : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setErr("");
              try {
                onChange(await uploadImage(f));
              } catch (x) {
                setErr(x instanceof Error ? x.message : "Upload failed");
              }
              setBusy(false);
            }}
          />
        </label>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

type ProjectDraft = { title: string; description: string; tags: string; image_url: string; link: string; category_id: string; sort_order: number };

function ProjectsAdmin({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const refresh = useRefresh();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [err, setErr] = useState("");

  const open = (p?: Project) => {
    setErr("");
    setEditing(p ? p.id : "new");
    setDraft({
      title: p?.title ?? "",
      description: p?.description ?? "",
      tags: p?.tags.join(", ") ?? "",
      image_url: p?.image_url ?? "",
      link: p?.link ?? "",
      category_id: p?.category_id ?? "",
      sort_order: p?.sort_order ?? projects.length + 1,
    });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return setErr("Title is required");
    let link = draft.link.trim();
    if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;
    const row = {
      title: draft.title.trim().slice(0, 200),
      description: draft.description.trim().slice(0, 2000),
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
      image_url: draft.image_url.trim() || null,
      link: link || null,
      category_id: draft.category_id || null,
      sort_order: Number(draft.sort_order) || 0,
    };
    const res = editing === "new"
      ? await supabase.from("projects").insert(row)
      : await supabase.from("projects").update(row).eq("id", editing!);
    if (res.error) return setErr(res.error.message);
    setEditing(null);
    refresh();
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) alert(error.message);
    refresh();
  };

  return (
    <div className="space-y-4">
      <button className={btnPrimary} onClick={() => open()}>
        <Plus className="size-4" /> Add project
      </button>
      {editing && draft && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editing === "new" ? "New project" : "Edit project"}</h3>
            <button onClick={() => setEditing(null)} aria-label="Close"><X className="size-5" /></button>
          </div>
          <div className="grid gap-3">
            <input className={input} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <textarea className={input} rows={3} placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <input className={input} placeholder="Project link (https://...)" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
            <input className={input} placeholder="Tags, separated by commas" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={`${input} bg-background`} value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className={input} type="number" placeholder="Order" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </div>
            <ImageField value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={save}>Save</button>
              <button className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Card>
      )}
      {projects.map((p) => {
        const img = resolveImage(p.image_url);
        return (
          <Card key={p.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {img ? <img src={img} alt="" className="h-20 w-full rounded-lg object-cover sm:w-32" /> : <div className="h-20 w-full rounded-lg bg-secondary sm:w-32" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.title}</p>
                <p className="truncate text-sm text-muted-foreground">{p.link || "No link yet"}</p>
                <p className="text-xs text-muted-foreground">
                  {categories.find((c) => c.id === p.category_id)?.name ?? "No category"}
                </p>
              </div>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => open(p)}><Pencil className="size-4" /> Edit</button>
                <button className={`${btnGhost} hover:border-destructive hover:text-destructive`} onClick={() => remove(p)}><Trash2 className="size-4" /></button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function CategoriesAdmin({ categories }: { categories: Category[] }) {
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim().slice(0, 100), sort_order: categories.length + 1 });
    if (error) return alert(error.message);
    setName("");
    refresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Categories group your projects on the site (e.g. Networking, Web).</p>
      <div className="flex gap-2">
        <input className={input} placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={btnPrimary} onClick={add}><Plus className="size-4" /> Add</button>
      </div>
      {categories.map((c) => (
        <Card key={c.id}>
          <div className="flex gap-2">
            <input className={input} value={edits[c.id] ?? c.name} onChange={(e) => setEdits({ ...edits, [c.id]: e.target.value })} />
            <button
              className={btnGhost}
              onClick={async () => {
                const v = (edits[c.id] ?? c.name).trim();
                if (!v) return;
                const { error } = await supabase.from("categories").update({ name: v }).eq("id", c.id);
                if (error) alert(error.message);
                refresh();
              }}
            >
              Save
            </button>
            <button
              className={`${btnGhost} hover:border-destructive hover:text-destructive`}
              onClick={async () => {
                if (!confirm(`Delete category "${c.name}"? Its projects stay, without a category.`)) return;
                const { error } = await supabase.from("categories").delete().eq("id", c.id);
                if (error) alert(error.message);
                refresh();
              }}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

type SectionDraft = { title: string; body: string; image_url: string; sort_order: number };

function SectionsAdmin({ sections }: { sections: CustomSection[] }) {
  const refresh = useRefresh();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<SectionDraft | null>(null);
  const [err, setErr] = useState("");

  const open = (s?: CustomSection) => {
    setErr("");
    setEditing(s ? s.id : "new");
    setDraft({ title: s?.title ?? "", body: s?.body ?? "", image_url: s?.image_url ?? "", sort_order: s?.sort_order ?? 900 + sections.length });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return setErr("Title is required");
    const row = {
      title: draft.title.trim().slice(0, 200),
      body: draft.body.trim().slice(0, 5000),
      image_url: draft.image_url.trim() || null,
      sort_order: Number(draft.sort_order) || 0,
    };
    const res = editing === "new"
      ? await supabase.from("custom_sections").insert(row)
      : await supabase.from("custom_sections").update(row).eq("id", editing!);
    if (res.error) return setErr(res.error.message);
    setEditing(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add extra sections (e.g. Certificates, Experience). Change where they appear in the "Section order" tab.</p>
      <button className={btnPrimary} onClick={() => open()}><Plus className="size-4" /> Add section</button>
      {editing && draft && (
        <Card>
          <div className="grid gap-3">
            <input className={input} placeholder="Section title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <textarea className={input} rows={5} placeholder="Section text" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            <ImageField value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <button className={btnPrimary} onClick={save}>Save</button>
              <button className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </Card>
      )}
      {sections.length === 0 && !editing && <p className="text-sm text-muted-foreground">No extra sections yet.</p>}
      {sections.map((s) => (
        <Card key={s.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => open(s)}><Pencil className="size-4" /> Edit</button>
              <button
                className={`${btnGhost} hover:border-destructive hover:text-destructive`}
                onClick={async () => {
                  if (!confirm(`Delete section "${s.title}"?`)) return;
                  const { error } = await supabase.from("custom_sections").delete().eq("id", s.id);
                  if (error) alert(error.message);
                  refresh();
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


function SkillsAdmin({ skills }: { skills: Skill[] }) {
  const refresh = useRefresh();
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("code");
  const Preview = skillIcon(icon);
  const add = async () => {
    if (!label.trim()) return;
    const max = Math.max(0, ...skills.map((s) => s.sort_order));
    const { error } = await supabase.from("skills").insert({ label: label.trim().slice(0, 60), icon, sort_order: max + 1 });
    if (error) return alert(error.message);
    setLabel("");
    refresh();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input className={input} placeholder="New skill (e.g. OSPF)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="flex gap-2">
          <span className="flex items-center rounded-lg border border-border px-3"><Preview className="size-5 text-accent" /></span>
          <select className={`${input} bg-background sm:w-40`} value={icon} onChange={(e) => setIcon(e.target.value)}>
            {Object.keys(SKILL_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button className={btnPrimary} onClick={add}><Plus className="size-4" /> Add</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {skills.map((s) => {
          const Icon = skillIcon(s.icon);
          return (
            <Card key={s.id}>
              <div className="flex items-center gap-3">
                <Icon className="size-5 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.label}</span>
                <button
                  aria-label={`Delete ${s.label}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    if (!confirm(`Delete skill "${s.label}"?`)) return;
                    const { error } = await supabase.from("skills").delete().eq("id", s.id);
                    if (error) alert(error.message);
                    refresh();
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function OrderAdmin({ data }: { data: { order: { key: string; sort_order: number }[]; sections: CustomSection[] } }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const items = orderedSections(data.order, data.sections);
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const tmp = next[i]!; next[i] = next[j]!; next[j] = tmp;
    setBusy(true);
    const ops = next.map((it, idx) => {
      const sort_order = (idx + 1) * 10;
      return it.kind === "builtin"
        ? supabase.from("section_order").upsert({ key: it.key, sort_order })
        : supabase.from("custom_sections").update({ sort_order }).eq("id", it.key);
    });
    const res = await Promise.all(ops);
    const e = res.find((r) => r.error);
    if (e?.error) alert(e.error.message);
    setBusy(false);
    refresh();
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Use the arrows to choose the order sections appear on your site. The opening "SAJAD" screen always stays first.</p>
      {items.map((it, i) => (
        <Card key={it.key}>
          <div className="flex items-center gap-3">
            <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{it.title}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{it.kind === "builtin" ? "Main" : "Your section"}</span>
            <button className={btnGhost} disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-4" /></button>
            <button className={btnGhost} disabled={busy || i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-4" /></button>
          </div>
        </Card>
      ))}
    </div>
  );
}
