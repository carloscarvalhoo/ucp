const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  { parseHTML } = require('linkedom'),
  { normalizeImported, normalizeDocument } = require('../cms/presentation.cjs');
test('conteúdo com tags desequilibradas vira cards dentro do artigo', () => {
  const html =
    'Biblioteca</div></section><section><div><a href="/normas"><h2>Normas</h2><strong>LEIA MAIS</strong></a></div></section></div>';
  const result = normalizeImported(html, 'Biblioteca');
  const { document } = parseHTML(
    '<html><body><main><div class="inner-layout"><aside>Menu</aside><article class="imported-content">' +
      result +
      '</article></div></main></body></html>',
  );
  assert.equal(document.querySelectorAll('main > section').length, 0);
  assert.equal(document.querySelectorAll('.resource-grid .resource-card').length, 1);
  assert.ok(document.querySelector('.imported-content').textContent.includes('Normas'));
});
test('normalização reposiciona seção escapada e remove ícone antigo do estágio', () => {
  const { document } = parseHTML(
    '<html><body><main><h1>Estágio</h1><div class="inner-layout"><aside>Menu</aside><article class="imported-content"><p><img src="https://ucpparana.edu.br/content/uploads/2015/12/1.png"></p></article></div><section><p>– Um<br>– Dois</p></section></main></body></html>',
  );
  normalizeDocument(document);
  assert.equal(document.querySelectorAll('main > section').length, 0);
  assert.equal(document.querySelectorAll('.imported-content img').length, 0);
  assert.equal(document.querySelectorAll('.imported-content li').length, 2);
});
test('calendário ganha card e prévia, e mapa usa o iframe informado', () => {
  const html = normalizeImported(
    '<p><a href="/arquivo.pdf">Calendário 2026</a></p>',
    'Calendário Acadêmico',
  );
  const { document } = parseHTML('<html><body>' + html + '</body></html>');
  assert.ok(document.querySelector('.featured-document'));
  assert.equal(document.querySelector('.featured-document a').getAttribute('href'), '/arquivo.pdf');
  const again = normalizeImported(html, 'Calendário Acadêmico');
  assert.equal(
    parseHTML('<html><body>' + again + '</body></html>').document.querySelectorAll('.featured-document').length,
    1,
  );
  const map = require('../cms/location.cjs')(
    '<img src="map_pin.png"><a href="https://www.google.com/maps/embed?antigo">Abrir serviço externo</a>',
  );
  assert.ok(map.includes('!2d-51.78632132387822'));
  assert.ok(!map.includes('map_pin.png'));
  assert.equal(
    parseHTML('<html><body>' + map + '</body></html>').document.querySelectorAll('iframe').length,
    1,
  );
});
test('prévia do calendário continua visível depois da aplicação das edições publicadas',()=>{const href=Object.keys(require('../document-previews.json')).find(k=>k.startsWith('/'));const first=normalizeImported('<p><a href="'+href+'">Calendário 2026</a></p>','Calendário Acadêmico');const second=normalizeImported(first,'Calendário Acadêmico');const {document}=parseHTML('<html><body>'+second+'</body></html>');assert.equal(document.querySelectorAll('.document-preview img').length,2);assert.equal(document.querySelectorAll('iframe').length,0);});
