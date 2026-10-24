import 'server-only';
import sanitize from 'sanitize-html';
import { parseHTML, rendered, fieldsFor, type ContentData } from './content-domain';
import type { TextBlock } from './content-types';
const candidate = 'h1,h2,h3,h4,p,ul,ol,table,blockquote';
const ignore =
  '[data-publication-blocks],.main-nav,.footer-nav,.quick-card,.project-card,.community-card,.course-summary,.breadcrumbs,button,svg';
function nodePath(root: any, target: any): number[] {
  const result: number[] = [];
  for (let el = target; el && el !== root; el = el.parentNode)
    result.unshift(Array.from(el.parentNode.childNodes).indexOf(el));
  return result;
}
function collect(data: ContentData) {
  if (!data.template) return { root: null, blocks: [] as { block: TextBlock; nodes: any[] }[] };
  const { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
  const root = document.body.firstElementChild;
  const all = Array.from(root.querySelectorAll(candidate)).filter((el: any) => {
    if (el.closest(ignore) || el.querySelector('img,iframe,video,audio,form,input')) return false;
    for (let p = el.parentElement; p && p !== root; p = p.parentElement)
      if (p.matches(candidate)) return false;
    return true;
  }) as any[];
  const consumed = new Set<any>(),
    blocks: { block: TextBlock; nodes: any[] }[] = [];
  for (const el of all) {
    if (consumed.has(el)) continue;
    const heading = /^H[1-4]$/.test(el.tagName);
    const nodes = [el];
    if (!heading) {
      let next = el.nextElementSibling;
      while (next && all.includes(next) && !/^H[1-4]$/.test(next.tagName)) {
        nodes.push(next);
        consumed.add(next);
        next = next.nextElementSibling;
      }
    }
    const parent = el.closest('section,article') || root;
    const group =
      parent.querySelector('h1,h2,h3')?.textContent?.trim() ||
      root.querySelector('h1,h2')?.textContent?.trim() ||
      'Conteúdo principal';
    let previous = el.previousElementSibling;
    while (previous && !/^H[1-4]$/.test(previous.tagName))
      previous = previous.previousElementSibling;
    const label = heading
      ? el.tagName === 'H1'
        ? 'Título da página'
        : 'Título da seção'
      : previous?.textContent?.trim() || group;
    const indices: number[] = [];
    data.fields.forEach((field, index) => {
      let target = root;
      for (const i of field.path) target = target?.childNodes[i];
      if (nodes.some((node) => node === target || node.contains(target))) indices.push(index);
    });
    blocks.push({
      block: {
        id: nodePath(root, el).join('.'),
        kind: heading ? 'heading' : 'body',
        label,
        group,
        value: heading ? el.textContent : nodes.map((n) => n.outerHTML).join(''),
        fieldIndices: indices,
      },
      nodes,
    });
  }
  return { root, blocks };
}
export function getTextBlocks(data: ContentData) {
  return collect(data).blocks.map((item) => item.block);
}
export function applyTextBlocks(data: ContentData, changes: unknown) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes))
    throw Error('Blocos de texto inválidos.');
  const { root, blocks } = collect(data);
  if (!root) throw Error('Este conteúdo não possui texto editável por blocos.');
  const values = changes as Record<string, unknown>;
  if (Object.keys(values).some((id) => !blocks.some((item) => item.block.id === id)))
    throw Error('O conteúdo foi reorganizado. Recarregue antes de salvar.');
  for (const { block, nodes } of blocks.slice().reverse()) {
    if (!(block.id in values)) continue;
    const value = values[block.id];
    if (typeof value !== 'string' || value.length > (block.kind === 'heading' ? 400 : 150000))
      throw Error('Texto inválido ou muito longo.');
    if (block.kind === 'heading') {
      nodes[0].textContent = value;
      continue;
    }
    const html = sanitize(value, {
      allowedTags: [
        'p',
        'h2',
        'h3',
        'h4',
        'strong',
        'b',
        'em',
        'i',
        'u',
        's',
        'br',
        'ul',
        'ol',
        'li',
        'a',
        'blockquote',
        'table',
        'tbody',
        'thead',
        'tr',
        'th',
        'td',
      ],
      allowedAttributes: {
        a: ['href', 'target', 'rel'],
        td: ['colspan', 'rowspan'],
        th: ['colspan', 'rowspan'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowProtocolRelative: false,
      transformTags: {
        a: (_tag, attrs) => ({
          tagName: 'a',
          attribs: {
            href: attrs.href || '',
            ...(attrs.target === '_blank' ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
        }),
      },
    });
    const { document } = parseHTML('<html><body>' + html + '</body></html>');
    for (const el of Array.from(document.body.childNodes))
      nodes[0].parentNode.insertBefore(el, nodes[0]);
    for (const node of nodes) node.remove();
  }
  data.template = root.outerHTML;
  data.fields = fieldsFor(root);
  return data;
}
