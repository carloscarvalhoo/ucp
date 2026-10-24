import type { MetadataRoute } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, publicURL } from '@/lib/services';
import { prisma } from '@/lib/prisma';
import { siteURL } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = new Set<string>();
  async function walk(dir: string) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) await walk(full);
      else if (item.name.endsWith('.html'))
        urls.add(
          publicURL(
            '/' + path.relative(path.join(projectRoot, 'dist'), full).replaceAll('\\', '/'),
          ),
        );
    }
  }
  await walk(path.join(projectRoot, 'dist'));
  const entries = await prisma.content_entries.findMany({
    select: { kind: true, status: true, draft_data: true, published_data: true },
  });
  for (const entry of entries) {
    const draft = entry.draft_data as { route?: string; selector?: string };
    const published = entry.published_data as { route?: string } | null;
    if (
      entry.status === 'published' &&
      ['course', 'publication'].includes(entry.kind) &&
      published?.route
    )
      urls.add(publicURL(published.route));
    else if (entry.status !== 'published' && draft.selector === 'main' && draft.route)
      urls.delete(publicURL(draft.route));
  }
  return Array.from(urls).map((url) => ({
    url: siteURL + url,
    changeFrequency: url === '/' ? 'weekly' : 'monthly',
    priority: url === '/' ? 1 : 0.7,
  }));
}
