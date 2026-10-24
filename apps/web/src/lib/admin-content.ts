import { renderPublicationBlocks, publicationDate } from './publication-blocks';
import { applyTextBlocks } from './text-blocks';
import { applyCollection, getCollection, type Collection } from './collections';
import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma';
import { projectRoot } from './services-env';
import {
  parseHTML,
  fieldsFor,
  rendered,
  asData,
  jsonData,
  type ContentData,
} from './content-domain';
export function safeURL(value: unknown, image = false) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value, 'http://local');
    return (image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:']).includes(
      u.protocol,
    );
  } catch {
    return false;
  }
}
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
function escape(value: unknown) {
  return String(value || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
export async function createContent(input: Record<string, unknown>, userId: bigint) {
  const title = String(input.title || '')
    .trim()
    .slice(0, 255);
  if (!title) throw Error('Informe um título.');
  if (input.image && !safeURL(input.image, true)) throw Error('Informe uma imagem válida.');
  let kind: string, route: string, template: string;
  const base = slugify(String(input.slug || title));
  if (!base) throw Error('Informe um nome válido.');
  if (input.type === 'banner') {
    if (!input.image || !safeURL(input.link)) throw Error('Informe imagem e destino do banner.');
    kind = 'banner';
    route = '/index.html';
    template =
      '<div class="banner-slide" data-banner><a href="' +
      escape(input.link) +
      '"><img src="' +
      escape(input.image) +
      '" alt="' +
      escape(title) +
      '"></a></div>';
  } else if (input.type === 'course') {
    if (!String(input.duration || '').trim() || !String(input.diploma || '').trim())
      throw Error('Informe duração e diploma.');
    kind = 'course';
    route = '/cursos/' + base + '.html';
    template =
      '<main id="conteudo"><div class="course-hero"><div class="wrap course-hero-grid"><div><div class="breadcrumbs"><a href="/">Início</a> / <a href="/#cursos">Cursos</a></div><span class="course-mode" data-course-mode>' +
      escape(input.mode === 'Smart' ? 'Smart' : 'Presencial') +
      '</span><h1 data-course-name>' +
      escape(title) +
      '</h1><div class="course-summary"><span><small>Diploma</small><strong data-course-diploma>' +
      escape(input.diploma) +
      '</strong></span><span><small>Duração</small><strong data-course-duration>' +
      escape(input.duration) +
      '</strong></span><span><small>Período</small><strong data-course-period>' +
      escape(input.period || 'Consulte a UCP') +
      '</strong></span></div><a class="solid-button" href="/contato/coordenacao">Falar com a coordenação</a></div><img data-course-image src="' +
      escape(input.image || '/assets/campus.jpg') +
      '" alt="' +
      escape(title) +
      '"></div></div><article class="wrap section imported-content"><h2>Sobre o curso</h2><p class="publication-text">' +
      escape(input.body) +
      '</p></article></main>';
  } else {
    const publication = ['noticias', 'blog', 'eventos'].includes(String(input.type));
    if (!publication && input.type !== 'page') throw Error('Tipo de cadastro inválido.');
    if (
      !String(input.body || '').trim() &&
      !(Array.isArray(input.publicationBlocks) && input.publicationBlocks.length)
    )
      throw Error('Informe o texto de apresentação.');
    kind = publication ? 'publication' : 'page';
    let parent = publication
      ? '/' + input.type
      : String(input.parent || '/institucional')
          .replace(/\.html$/, '')
          .replace(/\/$/, '');
    if (!/^\/[a-z0-9/-]*$/.test(parent) || /^\/(admin|api)(\/|$)/.test(parent))
      throw Error('Página principal inválida.');
    route = parent + '/' + base + '.html';
    template =
      '<main id="conteudo"><div class="page-heading"><div class="wrap"><div class="breadcrumbs"><a href="/">Início</a></div><h1>' +
      escape(title) +
      '</h1></div></div><article class="wrap section imported-content"><p class="publication-text">' +
      escape(input.body) +
      '</p>' +
      (input.image
        ? '<img class="publication-cover" src="' +
          escape(input.image) +
          '" alt="' +
          escape(title) +
          '">'
        : '') +
      (Array.isArray(input.publicationBlocks)
        ? '<div data-publication-blocks>' +
          renderPublicationBlocks(input.publicationBlocks) +
          '</div>'
        : '') +
      '</article></main>';
  }
  if (kind !== 'banner') {
    const duplicate = await prisma.content_entries.findFirst({
      where: { draft_data: { path: '$.route', equals: route } },
    });
    let staticFile = false;
    try {
      await fs.access(path.join(projectRoot, 'dist', route));
      staticFile = true;
    } catch {}
    if (duplicate || staticFile)
      route = route.replace(/\.html$/, '-' + crypto.randomBytes(3).toString('hex') + '.html');
  }
  const { document } = parseHTML('<html><body>' + template + '</body></html>');
  const element = document.body.firstElementChild;
  const data: ContentData = {
    route,
    selector: kind === 'banner' ? '.banner' : 'main',
    template: element.outerHTML,
    fields: fieldsFor(element),
    documents: [],
    ...(kind === 'publication'
      ? {
          contentType: String(input.type),
          publicationBlocks: Array.isArray(input.publicationBlocks) ? input.publicationBlocks : [],
          publicationDate: publicationDate(input.publicationDate),
        }
      : {}),
  };
  const entry = await prisma.content_entries.create({
    data: {
      kind,
      slug: kind + ':' + crypto.randomUUID(),
      title,
      status: 'draft',
      draft_data: jsonData(data),
      updated_by: userId,
    },
  });
  return Number(entry.id);
}
export async function saveSection(id: bigint, input: Record<string, unknown>, userId: bigint) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.content_entries.findUnique({ where: { id } });
    if (!entry) throw Error('Conteúdo não encontrado.');
    const data = asData(entry.draft_data);
    if (data.trashedAt) throw Error('Restaure o conteúdo antes de editar.');
    if (input.revision !== entry.revision) throw Error('CONFLICT');
    const values = input.values;
    if (!Array.isArray(values) || values.length !== data.fields.length)
      throw Error('Campos inválidos.');
    data.fields.forEach((field, index) => {
      const value = values[index];
      if (typeof value !== 'string' || value.length > 20000) throw Error('Conteúdo inválido.');
      if (['image', 'link'].includes(field.kind) && !safeURL(value, field.kind === 'image'))
        throw Error('Endereço inválido.');
      field.value = value;
    });
    if (!Array.isArray(input.documents) || input.documents.length > 100)
      throw Error('Lista de documentos inválida.');
    data.documents = input.documents.map((doc: { title: string; url: string }) => {
      if (typeof doc.title !== 'string' || !doc.title.trim() || !safeURL(doc.url))
        throw Error('Informe título e arquivo do documento.');
      return { title: doc.title.trim().slice(0, 255), url: doc.url };
    });
    if (input.collection) applyCollection(data, input.collection as Collection);
    if (input.textBlocks) applyTextBlocks(data, input.textBlocks);
    if (input.textBlocks && (data as ContentData & { collection?: Collection }).collection) {
      const metadata = (data as ContentData & { collection: Collection }).collection;
      delete (data as ContentData & { collection?: Collection }).collection;
      const fresh = getCollection(data);
      (data as ContentData & { collection: Collection }).collection = {
        ...metadata,
        fieldIndices: fresh?.fieldIndices || [],
      };
    }
    if (entry.kind === 'publication') {
      if (input.publicationDate !== undefined)
        data.publicationDate = publicationDate(input.publicationDate);
      if (input.publicationBlocks !== undefined) {
        const html = renderPublicationBlocks(input.publicationBlocks);
        const { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
        let container = document.querySelector('[data-publication-blocks]');
        if (!container) {
          container = document.createElement('div');
          container.setAttribute('data-publication-blocks', '');
          (document.querySelector('article') || document.querySelector('main')).append(container);
        }
        container.innerHTML = html;
        data.template = document.body.firstElementChild.outerHTML;
        data.fields = fieldsFor(document.body.firstElementChild);
        data.publicationBlocks = input.publicationBlocks as ContentData['publicationBlocks'];
      }
    }
    const result = await tx.content_entries.updateMany({
      where: { id, revision: entry.revision },
      data: {
        draft_data: jsonData(data),
        revision: { increment: 1 },
        updated_by: userId,
        updated_at: new Date(),
      },
    });
    if (!result.count) throw Error('CONFLICT');
    await tx.content_revisions.create({
      data: { entry_id: id, revision: entry.revision + 1, data: jsonData(data), author_id: userId },
    });
    return entry.revision + 1;
  });
}
export async function contentAction(id: bigint, action: string, userId: bigint) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.content_entries.findUnique({ where: { id } });
    if (!entry) throw Error('Conteúdo não encontrado.');
    const data = asData(entry.draft_data);
    if (action === 'activate' && !entry.published_data)
      throw Error('Publique este conteúdo antes de ativá-lo.');
    if (['shared', 'runtime'].includes(entry.kind) && action !== 'publish')
      throw Error('Este conteúdo é compartilhado. Edite os campos em vez de excluir.');
    if (action === 'restore') {
      if (
        !data.trashedAt ||
        data.purged ||
        Date.now() >= Date.parse(data.trashedAt) + 30 * 86400000
      )
        throw Error('O prazo de recuperação terminou.');
      delete data.trashedAt;
    } else if (data.trashedAt) throw Error('Restaure o conteúdo antes de continuar.');
    if (action === 'trash') data.trashedAt = new Date().toISOString();
    const result = await tx.content_entries.updateMany({
      where: { id, revision: entry.revision },
      data: {
        draft_data: jsonData(data),
        status: ['publish', 'activate'].includes(action)
          ? 'published'
          : action === 'restore'
            ? 'draft'
            : 'archived',
        revision: { increment: 1 },
        updated_by: userId,
        updated_at: new Date(),
        ...(action === 'publish'
          ? {
              published_data: jsonData(data),
              published_at: data.publicationDate
                ? new Date(data.publicationDate)
                : entry.published_at || new Date(),
            }
          : {}),
      },
    });
    if (!result.count) throw Error('CONFLICT');
    await tx.audit_events.create({
      data: { user_id: userId, action, entity_type: 'section', entity_id: String(id) },
    });
    return { ok: true };
  });
}
