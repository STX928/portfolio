import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import cryptoPreview from "../assets/project-crypto.jpg";
import socialPreview from "../assets/project-social.jpg";
import tasksPreview from "../assets/project-tasks.jpg";
import weatherPreview from "../assets/project-weather.jpg";
import portfolioPreview from "../assets/project-portfolio.jpg";
import gamePreview from "../assets/project-game.jpg";

export type Category = { id: string; name: string; sort_order: number };
export type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url: string | null;
  link: string | null;
  category_id: string | null;
  sort_order: number;
};
export type CustomSection = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  sort_order: number;
};

const BUILTIN: Record<string, string> = {
  "builtin:crypto": cryptoPreview,
  "builtin:social": socialPreview,
  "builtin:tasks": tasksPreview,
  "builtin:weather": weatherPreview,
  "builtin:portfolio": portfolioPreview,
  "builtin:game": gamePreview,
};

export function resolveImage(url: string | null | undefined) {
  if (!url) return null;
  return BUILTIN[url] ?? url;
}

export type Skill = { id: string; label: string; icon: string; sort_order: number };
export type OrderItem = { key: string; sort_order: number };

export const BUILTIN_SECTIONS: Record<string, string> = {
  about: "About Me",
  skill: "My Skills",
  project: "My Projects",
  contact: "Get In Touch (contact form)",
};

/** Merged, ordered list of built-in + custom sections. */
export function orderedSections(order: OrderItem[], sections: CustomSection[]) {
  const items: { kind: "builtin" | "custom"; key: string; title: string; sort_order: number }[] = [
    ...Object.keys(BUILTIN_SECTIONS).map((k) => ({
      kind: "builtin" as const,
      key: k,
      title: BUILTIN_SECTIONS[k] ?? k,
      sort_order: order.find((o) => o.key === k)?.sort_order ?? 0,
    })),
    ...sections.map((s) => ({ kind: "custom" as const, key: s.id, title: s.title, sort_order: s.sort_order })),
  ];
  return items.sort((a, b) => a.sort_order - b.sort_order);
}

export const portfolioQuery = queryOptions({
  queryKey: ["portfolio"],
  queryFn: async () => {
    const [p, c, s, k, o] = await Promise.all([
      supabase.from("projects").select("*").order("sort_order").order("created_at"),
      supabase.from("categories").select("*").order("sort_order").order("created_at"),
      supabase.from("custom_sections").select("*").order("sort_order").order("created_at"),
      supabase.from("skills").select("*").order("sort_order").order("created_at"),
      supabase.from("section_order").select("*"),
    ]);
    for (const r of [p, c, s, k, o]) if (r.error) throw r.error;
    return {
      projects: (p.data ?? []) as Project[],
      categories: (c.data ?? []) as Category[],
      sections: (s.data ?? []) as CustomSection[],
      skills: (k.data ?? []) as Skill[],
      order: (o.data ?? []) as OrderItem[],
    };
  },
});

export async function uploadImage(file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolio-images").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("portfolio-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr || !data) throw signErr ?? new Error("Could not create image link");
  return data.signedUrl;
}
