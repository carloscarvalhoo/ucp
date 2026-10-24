const { parseHTML } = require('linkedom');
const clean = (s) =>
  String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
function fieldsFor(element) {
  const fields = [];
  function visit(node, indices = []) {
    if (
      node.nodeType === 3 &&
      node.textContent.trim() &&
      !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode?.tagName)
    ) {
      fields.push({
        path: indices,
        kind: 'text',
        label: clean(node.textContent).slice(0, 90),
        value: node.textContent,
      });
    }
    if (node.nodeType === 1) {
      if (
        node.hasAttribute('data-publication-blocks') ||
        ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(node.tagName) ||
        node.classList?.contains('material-icons-outlined')
      )
        return;
      if (node.tagName === 'IMG') {
        fields.push({
          path: indices,
          kind: 'image',
          label: node.getAttribute('alt') || 'Imagem',
          value: node.getAttribute('src') || '',
        });
        fields.push({
          path: indices,
          kind: 'alt',
          label: 'Descrição da imagem',
          value: node.getAttribute('alt') || '',
        });
      }
      if (node.tagName === 'A' && node.getAttribute('href'))
        fields.push({
          path: indices,
          kind: 'link',
          label: clean(node.textContent).slice(0, 80) || 'Destino do link',
          value: node.getAttribute('href'),
        });
    }
    Array.from(node.childNodes || []).forEach((child, i) => visit(child, [...indices, i]));
  }
  visit(element);
  return fields;
}
function rendered(data) {
  const { document } = parseHTML('<html><body>' + data.template + '</body></html>');
  const element = document.body.firstElementChild;
  const parsedFields = fieldsFor(element);
  for (const [index, f] of data.fields.entries()) {
    let node = element;
    for (const i of f.path) node = node?.childNodes[i];
    const valid = (target) =>
      f.kind === 'text'
        ? target?.nodeType === 3
        : target?.nodeType === 1 && target.tagName === (f.kind === 'link' ? 'A' : 'IMG');
    if (!valid(node)) {
      const fresh = parsedFields[index];
      if (fresh?.kind !== f.kind) continue;
      node = element;
      for (const i of fresh.path) node = node?.childNodes[i];
    }
    if (!valid(node)) continue;
    if (f.kind === 'text') node.textContent = f.value;
    else node.setAttribute(f.kind === 'image' ? 'src' : f.kind === 'alt' ? 'alt' : 'href', f.value);
  }
  if (data.documents?.length) {
    const section = document.createElement('div');
    section.className = 'cms-document-list';
    const h = document.createElement('h2');
    h.textContent = 'Documentos';
    section.append(h);
    for (const doc of data.documents) {
      const p = document.createElement('p'),
        a = document.createElement('a');
      a.href = doc.url;
      a.textContent = doc.title;
      p.append(a);
      section.append(p);
    }
    element.append(section);
  }
  return element.outerHTML;
}
function groupsFor(data) {
  if (!data.template) return data.fields.map((f) => f.label.split(' — ')[0] || 'Conteúdo');
  const { document } = parseHTML('<html><body>' + data.template + '</body></html>');
  const root = document.body.firstElementChild;
  return data.fields.map((f) => {
    let target = root;
    for (const index of f.path) target = target?.childNodes[index];
    let element = target?.nodeType === 1 ? target : target?.parentElement;
    while (element && element !== root) {
      if (element.matches('section,header,footer,nav,article')) {
        const heading = element.querySelector('h1,h2,h3,h4');
        if (heading) return clean(heading.textContent).slice(0, 100);
        if (element.tagName === 'NAV') return 'Navegação';
      }
      const siblings = Array.from(element.parentElement?.children || []);
      for (let i = siblings.indexOf(element); i >= 0; i--) {
        const sibling = siblings[i];
        if (sibling.matches('h1,h2,h3,h4')) return clean(sibling.textContent).slice(0, 100);
      }
      element = element.parentElement;
    }
    return 'Apresentação e informações gerais';
  });
}

module.exports = { clean, fieldsFor, rendered, groupsFor };
