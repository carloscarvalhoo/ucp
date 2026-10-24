import sanitize from 'sanitize-html';
export type PublicationBlock = {
  id: string;
  type: 'text' | 'heading' | 'section' | 'image' | 'gallery' | 'button' | 'document';
  title?: string;
  subtitle?: string;
  text?: string;
  url?: string;
  caption?: string;
  images?: { url: string; caption: string }[];
};
const esc = (s: unknown) =>
  String(s || '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
function url(value: unknown, image = false) {
  const s = String(value || '').trim();
  if (!s || s.startsWith('//')) throw Error('Informe um endereço válido.');
  const u = new URL(s, 'https://local');
  if (!(image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:']).includes(u.protocol))
    throw Error('Endereço inválido.');
  return esc(s);
}
export function publicationDate(value: unknown) {
  if (typeof value !== 'string' || !value) return undefined;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) throw Error('Data de publicação inválida.');
  return d.toISOString();
}
export function renderPublicationBlocks(value: unknown) {
  if (!Array.isArray(value) || value.length > 100) throw Error('Lista de blocos inválida.');
  if (JSON.stringify(value).length > 500000) throw Error('Conteúdo muito grande.');
  return value
    .map((b: PublicationBlock) => {
      switch (b.type) {
        case 'heading':
          return '<h2>' + esc(b.title) + '</h2>';
        case 'section':
          return (
            '<section class="publication-section"><h2>' +
            esc(b.title) +
            '</h2>' +
            (b.subtitle ? '<p class="publication-subtitle">' + esc(b.subtitle) + '</p>' : '') +
            sanitize(b.text || '', {
              allowedTags: [
                'p',
                'strong',
                'em',
                'ul',
                'ol',
                'li',
                'a',
                'blockquote',
                'br',
                'h3',
                'h4',
              ],
              allowedAttributes: { a: ['href', 'title'] },
              allowedSchemes: ['http', 'https', 'mailto', 'tel'],
            }) +
            '</section>'
          );
        case 'text':
          return sanitize(b.text || '', {
            allowedTags: [
              'p',
              'strong',
              'em',
              'ul',
              'ol',
              'li',
              'a',
              'blockquote',
              'br',
              'h2',
              'h3',
              'h4',
              'table',
              'thead',
              'tbody',
              'tr',
              'th',
              'td',
            ],
            allowedAttributes: { a: ['href', 'title'] },
            allowedSchemes: ['http', 'https', 'mailto', 'tel'],
          });
        case 'image':
          return (
            '<figure><img loading="lazy" src="' +
            url(b.url, true) +
            '" alt="' +
            esc(b.caption) +
            '">' +
            (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') +
            '</figure>'
          );
        case 'gallery':
          if (!Array.isArray(b.images) || b.images.length > 30) throw Error('Galeria inválida.');
          return (
            '<div class="publication-gallery">' +
            b.images
              .map(
                (i) =>
                  '<figure><img loading="lazy" src="' +
                  url(i.url, true) +
                  '" alt="' +
                  esc(i.caption) +
                  '">' +
                  (i.caption ? '<figcaption>' + esc(i.caption) + '</figcaption>' : '') +
                  '</figure>',
              )
              .join('') +
            '</div>'
          );
        case 'button':
          return (
            '<p><a class="solid-button" href="' +
            url(b.url) +
            '">' +
            esc(b.title || 'Saiba mais') +
            '</a></p>'
          );
        case 'document':
          return (
            '<a class="document-card" href="' +
            url(b.url) +
            '" target="_blank" rel="noopener"><strong>' +
            esc(b.title || 'Documento') +
            '</strong><span>Abrir documento</span></a>'
          );
        default:
          throw Error('Tipo de bloco inválido.');
      }
    })
    .join('');
}
