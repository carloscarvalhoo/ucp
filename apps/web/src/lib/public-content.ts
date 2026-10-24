import { prisma } from './prisma';
import { cache } from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { projectRoot, content, parseHTML, publicURL, storageRoute } from './services';
export const getPublicPage = cache(async (pathname: string) => {
  const route = storageRoute(pathname);
  const hiddenCount = await prisma.content_entries.count({
    where: {
      status: { not: 'published' },
      kind: { in: ['section', 'course', 'publication', 'page'] },
      draft_data: { path: '$.route', equals: route },
      AND: { draft_data: { path: '$.selector', equals: 'main' } },
    },
  });
  if (hiddenCount) notFound();
  const root = path.join(projectRoot, 'dist');
  const target = path.resolve(root, '.' + route);
  if (!target.startsWith(root + path.sep)) notFound();
  let source: string;
  try {
    source = await fs.readFile(target, 'utf8');
  } catch {
    const candidates = await prisma.content_entries.findMany({
      where: { kind: { in: ['course', 'publication', 'page'] }, status: 'published' },
      select: { published_data: true },
    });
    const entries = candidates.filter(
      (entry) => (entry.published_data as { route?: string } | null)?.route === route,
    );
    if (!entries.length) notFound();
    source = await fs.readFile(path.join(root, 'noticias.html'), 'utf8');
  }
  const html = await content.page(source, route);
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll('[href],[src],[poster]')) {
    for (const attr of ['href', 'src', 'poster']) {
      const value = element.getAttribute(attr);
      if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) continue;
      const url = new URL(value, 'http://local' + route);
      element.setAttribute(attr, publicURL(url.pathname) + url.search + url.hash);
    }
  }
  document.querySelectorAll('a.brand').forEach((logo: any) => logo.setAttribute('href', '/'));
  for (const anchor of document.querySelectorAll('a[href^="#"]')) {
    const hash = anchor.getAttribute('href');
    if (hash && hash.length > 1 && !document.getElementById(hash.slice(1)))
      anchor.setAttribute('href', '/' + hash);
  }
  for (const form of document.querySelectorAll('form.site-search')) {
    form.setAttribute('action', '/busca');
    form.setAttribute('method', 'get');
    form.querySelector('input')?.setAttribute('name', 'q');
  }
  const scripts = Array.from(document.querySelectorAll('script')).map((el: any) => ({
    src: el.getAttribute('src') || undefined,
    text: el.textContent || '',
  }));
  document.querySelectorAll('script').forEach((el: any) => el.remove());
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((el: any) =>
    el.getAttribute('href'),
  ) as string[];
  return {
    html: document.body.innerHTML,
    title: document.title,
    description:
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      document
        .querySelector('main .course-content-section p, main .imported-content p')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim()
        .slice(0, 155) ||
      'Conheça a UCP, seus cursos e serviços.',
    styles,
    scripts,
  };
});
