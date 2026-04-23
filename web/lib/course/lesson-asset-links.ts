import type { Module } from "@/lib/store";

export type MaterialLink = { id: string; title: string; href: string; kind: string };

/**
 * Resolves how each material opens: direct URL, or authed app route for private S3.
 */
export function buildMaterialLinks(trackSlug: string, mod: Module): MaterialLink[] {
  if (!mod.materials?.length) return [];
  return mod.materials.map((m) => {
    if (m.url) {
      return { id: m.id, title: m.title, href: m.url, kind: m.kind };
    }
    const q = new URLSearchParams({ trackSlug, moduleId: mod.id, materialId: m.id });
    return { id: m.id, title: m.title, href: `/api/course/asset?${q.toString()}`, kind: m.kind };
  });
}
