const { test } = require('node:test');
const assert = require('node:assert/strict');
const { publicURL, storageRoute } = require('../cms/urls.cjs');
test('URLs públicas limpas preservam consultas, âncoras, arquivos e destinos externos', () => {
  assert.equal(publicURL('/index.html'), '/');
  assert.equal(
    publicURL('/cursos/administracao.html?turma=1#doc'),
    '/cursos/administracao?turma=1#doc',
  );
  assert.equal(publicURL('/arquivos/edital.pdf'), '/arquivos/edital.pdf');
  assert.equal(
    publicURL('https://externo.example/pagina.html'),
    'https://externo.example/pagina.html',
  );
  assert.equal(storageRoute('/cursos/administracao'), '/cursos/administracao.html');
  assert.equal(storageRoute('/'), '/index.html');
});
