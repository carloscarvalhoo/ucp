const { parseHTML } = require('linkedom');
const previews = require('../document-previews.json');
function previewElements(document, href, label) {
  return (previews[href.split('#')[0]] || [])
    .filter((_, index, all) => all.length < 3 || index > 0)
    .map((src, index) => {
      const link = document.createElement('a');
      link.className = 'document-preview';
      link.setAttribute('href', href.split('#')[0]);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      const image = document.createElement('img');
      image.setAttribute('src', src);
      image.setAttribute('alt', 'Prévia de ' + label + ' — página ' + (index + 1));
      image.setAttribute('loading', 'lazy');
      link.append(image);
      return link;
    });
}
function normalizeImported(html, title = '') {
  const { document } = parseHTML('<html><body>' + html + '</body></html>'),
    body = document.body;
  body.querySelectorAll('img[src]').forEach((img) => {
    if (/\/2015\/12\/1\.png(?:[?#]|$)/.test(img.getAttribute('src'))) img.remove();
  });
  for (const p of body.querySelectorAll('p')) {
    const parts = p.innerHTML
      .split(/<br\s*\/?\s*>/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length && parts.every((s) => /^(?:&#8211;|–|—|-)\s*/.test(s))) {
      const list = document.createElement('ul');
      for (const part of parts) {
        const li = document.createElement('li');
        li.innerHTML = part.replace(/^(?:&#8211;|–|—|-)\s*/, '');
        if (li.textContent.trim()) list.append(li);
      }
      p.replaceWith(list);
    } else if (!p.textContent.trim() && !p.querySelector('img,a')) p.remove();
  }
  const cards = [...body.querySelectorAll('a')].filter((a) => a.querySelector('h2'));
  if (cards.length) {
    let rest = body.textContent;
    for (const card of cards) rest = rest.replace(card.textContent, '');
    rest = rest.replace(title, '').trim();
    if (rest.length < 30) {
      const grid = document.createElement('div');
      grid.className = 'resource-grid';
      for (const card of cards) {
        card.className = 'resource-card';
        const h = card.querySelector('h2'),
          label = document.createElement('span');
        label.textContent = 'Acessar →';
        card.replaceChildren(h, label);
        grid.append(card);
      }
      body.replaceChildren(grid);
    }
  }
  const files = [...body.querySelectorAll('a[href]')].filter((a) =>
    /\.(pdf|docx?|xlsx?|pptx?|zip)(?:[?#]|$)/i.test(a.getAttribute('href')),
  );
  if (
    /calend[aá]rio acad[eê]mico/i.test(title) &&
    files.length &&
    !body.querySelector('.featured-document')
  ) {
    const file = files[0],
      label = file.textContent.trim();
    const card = document.createElement('section');
    card.className = 'featured-document';
    card.innerHTML =
      '<span class="material-icons-outlined" aria-hidden="true">calendar_month</span><p class="document-kicker">PLANEJE SUA ROTINA</p><h2></h2><p>Consulte as datas e atividades previstas no calendário acadêmico da UCP.</p>';
    card.querySelector('h2').textContent = label;
    file.textContent = 'Abrir calendário em PDF ↗';
    file.className = 'solid-button';
    file.setAttribute('target', '_blank');
    file.setAttribute('rel', 'noopener noreferrer');
    card.append(file);
    body.replaceChildren(card, ...previewElements(document, file.getAttribute('href'), label));
  } else
    for (const file of files) {
      if (
        file.closest('.featured-document,.document-list') ||
        file.classList.contains('document-card') || file.classList.contains('document-preview')
      )
        continue;
      if (file.closest('td,th')) continue;
      const label = file.textContent.trim();
      file.classList.add('document-card');
      file.textContent = '';
      const icon = document.createElement('span');
      icon.className = 'material-icons-outlined';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'description';
      const text = document.createElement('span');
      text.textContent = label;
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      file.append(icon, text, arrow);
      file.setAttribute('target', '_blank');
      file.setAttribute('rel', 'noopener noreferrer');
    }
  for (const old of body.querySelectorAll('iframe.document-preview'))
    old.replaceWith(...previewElements(document, old.getAttribute('src'), title));
  return body.innerHTML;
}
function normalizeDocument(document) {
  const main = document.querySelector('main'),
    layout = main?.querySelector('.inner-layout'),
    article = layout?.querySelector('.imported-content');
  if (!article) return;
  let next = layout.nextElementSibling;
  while (next) {
    const after = next.nextElementSibling;
    article.append(next);
    next = after;
  }
  article.innerHTML = normalizeImported(
    article.innerHTML,
    main.querySelector('h1')?.textContent || '',
  );
}
module.exports = { normalizeImported, normalizeDocument };
