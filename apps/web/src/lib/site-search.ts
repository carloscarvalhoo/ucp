import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma';
import { projectRoot } from './services-env';
import { parseHTML, rendered, asData, publicURL } from './content-domain';

export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export async function searchSite(query: string) {
  const terms = normalizeSearch(query.trim()).split(/\s+/).filter(Boolean).slice(0, 12);
  if (!terms.length) return [];
  const pages = new Map<string, string>();
  const root = path.join(projectRoot, 'dist');
  async function walk(folder: string) {
    for (const item of await fs.readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name);
      if (item.isDirectory()) await walk(file);
      else if (item.name.endsWith('.html'))
        pages.set(
          '/' + path.relative(root, file).replaceAll('\\', '/'),
          await fs.readFile(file, 'utf8'),
        );
    }
  }
  await walk(root);
  const entries = await prisma.content_entries.findMany({
    where: { kind: { in: ['section', 'course', 'publication', 'page'] } },
    select: { status: true, draft_data: true, published_data: true },
  });
  for (const entry of entries) {
    const data = asData(entry.published_data);
    if (
      entry.status === 'published' &&
      data?.selector === 'main' &&
      data.route &&
      !pages.has(data.route)
    )
      pages.set(data.route, '<html><body>' + rendered(data) + '</body></html>');
  }
  const results = [];
  for (const [route, source] of pages) {
    const related = entries.filter((e) => asData(e.draft_data)?.route === route);
    if (related.some((e) => e.status !== 'published' && asData(e.draft_data)?.selector === 'main'))
      continue;
    const { document } = parseHTML(source);
    for (const entry of related) {
      const data = asData(entry.status === 'published' ? entry.published_data : entry.draft_data);
      if (!data?.selector) continue;
      const element = document.querySelector(data.selector);
      if (entry.status !== 'published') element?.remove();
      else if (element) {
        const fragment = parseHTML('<html><body>' + rendered(data) + '</body></html>').document;
        if (fragment.body.firstElementChild) element.replaceWith(fragment.body.firstElementChild);
      }
    }
    const main = document.querySelector('main');
    if (!main) continue;
    main
      .querySelectorAll(
        'script,style,nav,[hidden],[aria-hidden="true"],.breadcrumbs,.section-menu,form,button,.solid-button,.course-mode,.course-summary',
      )
      .forEach((el: any) => el.remove());
    const title = (main.querySelector('h1')?.textContent || document.title || 'UCP')
      .replace(/\s+/g, ' ')
      .trim();
    for (const block of main.querySelectorAll('h1,h2,h3,h4,p,li,td,th,div,section,article'))
      block.append(document.createTextNode(' '));
    const text = main.textContent.replace(/\s+/g, ' ').trim();
    const normalized = normalizeSearch(title + ' ' + text);
    if (!terms.every((term) => normalized.includes(term))) continue;
    const position = normalizeSearch(text).indexOf(terms[0]);
    const start = Math.max(0, position - 60);
    const excerpt =
      (start ? '…' : '') + text.slice(start, start + 190) + (text.length > start + 190 ? '…' : '');
    const type = route.startsWith('/cursos/')
      ? 'Curso'
      : route.startsWith('/noticias/')
        ? 'Notícia'
        : route.startsWith('/blog/')
          ? 'Blog'
          : route.startsWith('/eventos/')
            ? 'Evento'
            : 'Página';
    const score = terms.reduce(
      (total, term) => total + (normalizeSearch(title).includes(term) ? 10 : 1),
      0,
    );
    results.push({ title, excerpt, type, url: publicURL(route), score });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'pt-BR'));
}
