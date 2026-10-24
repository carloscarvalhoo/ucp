const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loader = require('./helpers/load-typescript.cjs');
const memory = require('./helpers/memory-prisma.cjs');
const root = path.resolve(__dirname, '..');
test('busca ignora acentos, prioriza título e não expõe rascunhos nem páginas ocultas', async () => {
  const prisma = memory();
  const load = loader({ './prisma': { prisma }, './services-env': { projectRoot: root } });
  const { searchSite } = load('lib/site-search.ts');
  const data = {
    route: '/busca-teste-exclusivo.html',
    selector: 'main',
    template:
      '<main><h1>Teste exclusivo acadêmico</h1><p>Conteúdo publicado para a busca.</p></main>',
    fields: [],
  };
  const entry = await prisma.content_entries.create({
    data: {
      kind: 'page',
      status: 'published',
      published_data: data,
      draft_data: { ...data, template: '<main><h1>Segredo do rascunho</h1></main>' },
    },
  });
  let results = await searchSite('exclusivo academico');
  assert.ok(results.some((r) => r.url === '/busca-teste-exclusivo'));
  assert.equal((await searchSite('Segredo do rascunho')).length, 0);
  await prisma.content_entries.update({ where: { id: entry.id }, data: { status: 'archived' } });
  assert.equal((await searchSite('exclusivo academico')).length, 0);
  assert.deepEqual(await searchSite('   '), []);
  assert.ok((await searchSite('administracao'))[0].url.includes('/cursos/administracao'));
});
