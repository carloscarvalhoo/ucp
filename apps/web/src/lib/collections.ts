import 'server-only';
import { parseHTML, rendered, fieldsFor, type ContentData } from './content-domain';
import { safeURL } from './admin-content';
export type CollectionItem = {
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  link?: string;
  hidden?: boolean;
  automatic?: boolean;
  children?: CollectionItem[];
};
export type Collection = {
  type: 'gallery' | 'quick' | 'projects' | 'community' | 'instagram' | 'header' | 'footer';
  items: CollectionItem[];
  fieldIndices: number[];
  embedUrl?: string;
  auto?: boolean;
};
const WIDGET_HOSTS = [
  'lightwidget.com',
  'www.lightwidget.com',
  'elfsight.com',
  'static.elfsight.com',
  'snapwidget.com',
  'cdn.lightwidget.com',
];
export function isAllowedInstagramWidgetURL(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && WIDGET_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}
const selectors = {
  quick: '.quick-track',
  projects: '.project-grid',
  community: '.community-track',
  instagram: '#instagram-feed',
  header: '.main-nav',
  footer: '.footer-nav',
};
export function getCollection(data: ContentData): Collection | null {
  if ((data as ContentData & { collection?: Collection }).collection)
    return (data as ContentData & { collection: Collection }).collection;
  if (data.key === 'ucpPhotos') {
    const values = structuredClone(data.value || []) as string[][];
    for (const f of data.fields) {
      const [i, j] = f.path as number[];
      if (values[i]) values[i][j] = f.value;
    }
    return {
      type: 'gallery',
      items: values.map((value) => ({ title: value[1] || 'Foto', image: value[0] })),
      fieldIndices: data.fields.map((_, i) => i),
    };
  }
  if (!data.template) return null;
  const { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
  const root = document.body.firstElementChild;
  let type: Exclude<Collection['type'], 'gallery'> | undefined;
  for (const [key, selector] of Object.entries(selectors))
    if (root.matches(selector) || root.querySelector(selector)) {
      type = key as typeof type;
      break;
    }
  if (!type) return null;
  const container = root.matches(selectors[type]) ? root : root.querySelector(selectors[type]);
  if (type === 'instagram' && container.getAttribute('data-mode') === 'widget') {
    const iframeSrc = container.querySelector('iframe')?.getAttribute('src') || '';
    return { type, items: [], fieldIndices: [], embedUrl: iframeSrc };
  }
  if (type === 'instagram' && container.getAttribute('data-mode') === 'auto')
    return { type, items: [], fieldIndices: [], auto: true };
  let items: CollectionItem[] = [];
  if (type === 'header')
    items = Array.from(container.children).map((el: any) => ({
      title: el.querySelector('.nav-trigger')?.textContent || el.textContent,
      link: el.getAttribute('href') || '',
      automatic:
        el.querySelector('.nav-trigger')?.textContent.trim() === 'Cursos' ||
        el.hasAttribute('data-catalog'),
      ...(el.querySelector('.dropdown')
        ? {
            children: Array.from(el.querySelectorAll('.dropdown a')).map((a: any) => ({
              title: a.textContent,
              link: a.getAttribute('href'),
            })),
          }
        : {}),
    }));
  else if (type === 'footer')
    items = Array.from(container.children).map((el: any) => ({
      title: el.querySelector('h3')?.textContent || 'Grupo',
      children: Array.from(el.querySelectorAll('a')).map((a: any) => ({
        title: a.textContent,
        link: a.getAttribute('href'),
      })),
    }));
  else
    items = Array.from(container.querySelectorAll('a'))
      .filter(
        (el: any) =>
          !(
            type === 'quick' &&
            ['Apoio acadêmico', 'Cursos de graduação', 'Cursos de pós-graduação'].includes(
              el.querySelector('h2')?.textContent.trim(),
            )
          ) &&
          !(type === 'projects' && el.querySelector('h3')?.textContent === 'Bolsas e incentivos'),
      )
      .map((el: any) => ({
        title: el.querySelector('h2,h3,.instagram-caption')?.textContent || '',
        description: el.querySelector('p')?.textContent || '',
        image: el.querySelector('img')?.getAttribute('src') || '',
        icon: el.querySelector('.material-icons-outlined')?.textContent || '',
        link: el.getAttribute('href') || '',
      }));
  const fieldIndices: number[] = [];
  data.fields.forEach((f, index) => {
    let el = root;
    for (const key of f.path) el = el?.childNodes[key];
    if (el?.nodeType !== 1) el = el?.parentElement;
    if (el && container.contains(el)) fieldIndices.push(index);
  });
  return { type, items, fieldIndices };
}
export function applyCollection(data: ContentData, input: Collection) {
  const current = getCollection(data);
  if (!current || input.type !== current.type) throw Error('Lista de itens inválida.');
  if (input.type === 'instagram' && input.embedUrl) {
    if (!isAllowedInstagramWidgetURL(input.embedUrl))
      throw Error('URL do widget inválida. Use um link do LightWidget, Elfsight ou SnapWidget.');
    const { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
    const root = document.body.firstElementChild;
    const container = root.matches(selectors.instagram)
      ? root
      : root.querySelector(selectors.instagram);
    container.replaceChildren();
    container.setAttribute('data-mode', 'widget');
    container.setAttribute('aria-busy', 'false');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', input.embedUrl);
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Publicações recentes do Instagram da UCP');
    iframe.className = 'instagram-widget-frame';
    container.append(iframe);
    data.template = root.outerHTML;
    data.fields = fieldsFor(root);
    delete (data as ContentData & { collection?: Collection }).collection;
    (data as ContentData & { collection: Collection }).collection = {
      type: 'instagram',
      items: [],
      fieldIndices: [],
      embedUrl: input.embedUrl,
    };
    return data;
  }
  if (input.type === 'instagram' && input.auto) {
    const { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
    const root = document.body.firstElementChild;
    const container = root.matches(selectors.instagram)
      ? root
      : root.querySelector(selectors.instagram);
    container.replaceChildren();
    container.setAttribute('data-mode', 'auto');
    container.setAttribute('aria-busy', 'false');
    data.template = root.outerHTML;
    data.fields = fieldsFor(root);
    delete (data as ContentData & { collection?: Collection }).collection;
    (data as ContentData & { collection: Collection }).collection = {
      type: 'instagram',
      items: [],
      fieldIndices: [],
      auto: true,
    };
    return data;
  }
  if (
    !Array.isArray(input.items) ||
    input.items.length > (input.type === 'instagram' ? 4 : 100)
  )
    throw Error('Lista de itens inválida.');
  function validate(item: CollectionItem, depth = 0): CollectionItem {
    if (!item || typeof item.title !== 'string' || !item.title.trim() || item.title.length > 150)
      throw Error('Informe o título de cada item, com até 150 caracteres.');
    if (item.link && !safeURL(item.link)) throw Error('Link do item inválido.');
    if (input.type === 'instagram') {
      let valid = false;
      try {
        const url = new URL(String(item.link));
        valid =
          url.protocol === 'https:' &&
          ['instagram.com', 'www.instagram.com'].includes(url.hostname) &&
          /\/(p|reel)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
      } catch {}
      if (!valid || !item.image)
        throw Error('Informe o link da publicação do Instagram e sua imagem.');
    }
    if (item.image && !safeURL(item.image, true)) throw Error('Imagem do item inválida.');
    if (item.description && item.description.length > 2000) throw Error('Descrição muito longa.');
    if (item.children && (depth > 0 || item.children.length > 100))
      throw Error('Subitens inválidos.');
    return {
      title: item.title.trim(),
      description: String(item.description || ''),
      link: String(item.link || ''),
      image: String(item.image || ''),
      icon: String(item.icon || 'arrow_forward').slice(0, 60),
      hidden: Boolean(item.hidden),
      automatic: Boolean(item.automatic),
      ...(item.children
        ? { children: item.children.map((child) => validate(child, depth + 1)) }
        : {}),
    };
  }
  const items = input.items.map((item) => validate(item));
  if (input.type === 'gallery') {
    data.value = items.filter((item) => !item.hidden).map((item) => [item.image, item.title]);
    if (data.value.some((value) => !(value as string[])[0]))
      throw Error('Selecione uma imagem para cada foto.');
    data.fields = (data.value as string[][]).flatMap((value, i) =>
      value.map((v, j) => ({
        path: [i, j],
        kind: j ? 'text' : 'image',
        label: 'Foto ' + (i + 1) + (j ? ' — descrição' : ''),
        value: v,
      })),
    );
    (data as ContentData & { collection: Collection }).collection = {
      type: 'gallery',
      items,
      fieldIndices: data.fields.map((_, i) => i),
    };
    return data;
  }
  const { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
  const root = document.body.firstElementChild;
  const container = root.matches(selectors[input.type])
    ? root
    : root.querySelector(selectors[input.type]);
  container.replaceChildren();
  if (input.type === 'instagram') {
    container.setAttribute('data-mode', 'manual');
    container.setAttribute('aria-busy', 'false');
  }
  function element(tag: string, text?: string, className?: string) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function link(item: CollectionItem) {
    const a = element('a', item.title);
    a.setAttribute('href', item.link || '#');
    return a;
  }
  for (const item of items) {
    if (item.hidden) continue;
    if (input.type === 'instagram') {
      const a = element('a', undefined, 'social-tile');
      a.setAttribute('href', item.link!);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      const image = element('img');
      image.setAttribute('src', item.image!);
      image.setAttribute('alt', item.title);
      image.setAttribute('loading', 'lazy');
      a.append(image, element('strong', item.title, 'instagram-caption'));
      container.append(a);
    } else if (input.type === 'header') {
      if (item.children) {
        const group = element('div', undefined, 'nav-group mega-menu');
        if (item.automatic) group.setAttribute('data-catalog', 'true');
        const button = element('button', item.title, 'nav-trigger');
        button.setAttribute('aria-expanded', 'false');
        const dropdown = element('div', undefined, 'dropdown');
        dropdown.setAttribute(
          'style',
          '--menu-columns:3;--menu-rows:' + Math.max(1, Math.ceil(item.children.length / 3)),
        );
        for (const child of item.children) if (!child.hidden) dropdown.append(link(child));
        group.append(button, dropdown);
        container.append(group);
      } else container.append(link(item));
    } else if (input.type === 'footer') {
      const group = element('div');
      group.append(element('h3', item.title));
      for (const child of item.children || []) if (!child.hidden) group.append(link(child));
      container.append(group);
    } else {
      const a = element(
        'a',
        undefined,
        input.type === 'quick'
          ? 'quick-card'
          : input.type === 'projects'
            ? 'project-card'
            : 'community-card',
      );
      a.href = item.link || '#';
      if (input.type === 'community') {
        const img = element('img');
        img.src = item.image || '/assets/campus.jpg';
        img.alt = item.title;
        img.loading = 'lazy';
        a.append(img);
        const body = element('div');
        body.append(element('h3', item.title), element('p', item.description));
        a.append(body);
      } else {
        const icon = element('span', item.icon, 'material-icons-outlined');
        icon.setAttribute('aria-hidden', 'true');
        a.append(
          icon,
          element(input.type === 'quick' ? 'h2' : 'h3', item.title),
          element('p', item.description),
          element('span', input.type === 'quick' ? 'Acesse aqui!' : 'Saiba mais →'),
        );
      }
      container.append(a);
    }
  }
  data.template = root.outerHTML;
  data.fields = fieldsFor(root);
  delete (data as ContentData & { collection?: Collection }).collection;
  const rebuilt = getCollection(data);
  (data as ContentData & { collection: Collection }).collection = {
    type: input.type,
    items,
    fieldIndices: rebuilt?.fieldIndices || [],
  };
  return data;
}
