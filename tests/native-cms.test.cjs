const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const loader = require('./helpers/load-typescript.cjs'),
  memory = require('./helpers/memory-prisma.cjs');
const root = path.resolve(__dirname, '..');
function context() {
  const prisma = memory();
  const load = loader({
    './prisma': { prisma },
    '@/lib/prisma': { prisma },
    '@/generated/prisma/client': { Prisma: { DbNull: null } },
    './services-env': { projectRoot: root },
  });
  return { prisma, load };
}
test('editor agrupa parágrafos completos e preserva imagens e marcação segura', () => {
  const { load } = context(),
    domain = load('lib/content-domain.ts'),
    { getTextBlocks, applyTextBlocks } = load('lib/text-blocks.ts');
  const { document } = domain.parseHTML(
    '<html><body><main><h1>Página</h1><article><h2>Apresentação</h2><p>Texto <strong>em destaque</strong> e <a href="/contato">link</a>.</p><p>Outro parágrafo.</p><p><img src="/foto.jpg" alt="Foto"></p></article></main></body></html>',
  );
  const el = document.querySelector('main');
  const data = { route: '/teste.html', template: el.outerHTML, fields: domain.fieldsFor(el) };
  const blocks = getTextBlocks(data);
  const body = blocks.find((b) => b.kind === 'body');
  assert.ok(body.value.includes('Outro parágrafo.'));
  assert.equal(blocks.filter((b) => b.kind === 'body').length, 1);
  applyTextBlocks(data, {
    [body.id]:
      '<p>Novo <strong>texto</strong>.</p><p>Segundo</p><script>alert(1)</script><a href="javascript:alert(1)" style="color:red">ruim</a>',
  });
  const html = domain.rendered(data);
  assert.ok(html.includes('<strong>texto</strong>'));
  assert.ok(html.includes('/foto.jpg'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('style='));
});
test('coleções permitem ordenar e ocultar sem perder o item oculto', () => {
  const { load } = context(),
    domain = load('lib/content-domain.ts'),
    { getCollection, applyCollection } = load('lib/collections.ts');
  const { document } = domain.parseHTML(
    '<html><body><section><h2>Apoio</h2><div class="project-grid"><a class="project-card" href="/a"><h3>Um</h3><p>Descrição</p></a><a class="project-card" href="/b"><h3>Dois</h3></a></div></section></body></html>',
  );
  const el = document.querySelector('section'),
    data = { route: '/index.html', template: el.outerHTML, fields: domain.fieldsFor(el) };
  const c = getCollection(data);
  c.items.reverse();
  c.items[1].hidden = true;
  applyCollection(data, c);
  assert.equal(getCollection(data).items[1].title, 'Um');
  assert.equal(getCollection(data).items[1].hidden, true);
  assert.ok(!domain.rendered(data).includes('<h3>Um</h3>'));
  const restore = getCollection(data);
  restore.items[1].hidden = false;
  applyCollection(data, restore);
  assert.ok(domain.rendered(data).includes('<h3>Um</h3>'));
});
test('Prisma: ocultar e ativar preserva a versão publicada e a lixeira restaura como rascunho', async () => {
  const { prisma, load } = context(),
    { contentAction } = load('lib/admin-content.ts');
  const data = {
    route: '/teste.html',
    selector: 'main',
    template: '<main><p>Rascunho</p></main>',
    fields: [],
  };
  const entry = await prisma.content_entries.create({
    data: {
      kind: 'page',
      draft_data: data,
      published_data: { ...data, template: '<main><p>Publicado</p></main>' },
      status: 'published',
    },
  });
  await contentAction(entry.id, 'hide', 1n);
  assert.equal(
    (await prisma.content_entries.findUnique({ where: { id: entry.id } })).status,
    'archived',
  );
  await contentAction(entry.id, 'activate', 1n);
  let current = await prisma.content_entries.findUnique({ where: { id: entry.id } });
  assert.equal(current.status, 'published');
  assert.ok(current.published_data.template.includes('Publicado'));
  assert.ok(current.draft_data.template.includes('Rascunho'));
  await contentAction(entry.id, 'trash', 1n);
  await assert.rejects(() => contentAction(entry.id, 'activate', 1n));
  await contentAction(entry.id, 'restore', 1n);
  current = await prisma.content_entries.findUnique({ where: { id: entry.id } });
  assert.equal(current.status, 'draft');
  assert.equal(current.draft_data.trashedAt, undefined);
});
test('API nativa: autenticação, conflito de revisão e permissões com banco apenas em memória', async () => {
  const { prisma, load } = context(),
    auth = load('lib/admin-auth.ts'),
    { adminHandler } = load('lib/admin-api.ts'),
    domain = load('lib/content-domain.ts');
  await prisma.admin_users.create({
    data: {
      name: 'Teste isolado',
      email: 'teste@example.invalid',
      role: 'editor',
      password_hash: await auth.password('Senha-isolada-de-teste-123'),
    },
  });
  let cookie = '';
  async function request(endpoint, method = 'GET', body) {
    const req = new Request('http://local/api/admin/' + endpoint, {
      method,
      headers: { Origin: 'http://local', Cookie: cookie, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const response = await adminHandler(req);
    return { status: response.status, data: await response.json(), response };
  }
  assert.equal((await request('sections')).status, 401);
  const login = await request('login', 'POST', {
    email: 'teste@example.invalid',
    password: 'Senha-isolada-de-teste-123',
  });
  assert.equal(login.status, 200);
  cookie = login.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('users')).status, 404);
  assert.equal(
    (
      await request('setup', 'POST', {
        name: 'Outro',
        email: 'outro@example.invalid',
        password: 'Senha-isolada-de-teste-123',
      })
    ).status,
    409,
  );
  const { document } = domain.parseHTML(
    '<html><body><main><h1>Título</h1><p>Texto</p></main></body></html>',
  );
  const el = document.querySelector('main'),
    entry = await prisma.content_entries.create({
      data: {
        kind: 'page',
        title: 'Teste',
        slug: 'isolado',
        draft_data: {
          route: '/isolado.html',
          selector: 'main',
          template: el.outerHTML,
          fields: domain.fieldsFor(el),
          documents: [],
        },
      },
    });
  const section = (await request('sections/' + entry.id)).data;
  assert.ok(section.textBlocks.length > 0);
  const values = section.fields.map((f) => f.value);
  assert.equal(
    (await request('sections/' + entry.id, 'PUT', { revision: 1, values, documents: [] })).status,
    200,
  );
  assert.equal(
    (await request('sections/' + entry.id, 'PUT', { revision: 1, values, documents: [] })).status,
    409,
  );
  assert.equal((await request('recovery', 'POST', { email: 'teste@example.invalid' })).status, 404);
  assert.equal((await request('users', 'POST', { name: 'Outro' })).status, 404);
  assert.equal(
    (
      await request('account', 'PUT', {
        name: 'Teste',
        newPassword: 'Senha-Nova-Que-Nao-Deve-Ser-Aplicada',
      })
    ).status,
    400,
  );
  assert.equal((await request('account', 'PUT', { name: 'Nome atualizado' })).status, 200);
  assert.equal(await prisma.admin_users.count({}), 1);
  assert.equal((await request('logout', 'POST')).status, 200);
  assert.equal((await request('sections')).status, 401);
});
test('Instagram manual mantém quatro posts editáveis e exige links de publicações válidos', () => {
  const { load } = context(),
    domain = load('lib/content-domain.ts'),
    { getCollection, applyCollection } = load('lib/collections.ts');
  const { document } = domain.parseHTML(
    '<html><body><section id="instagram">' +
      require('../manual-instagram.cjs')() +
      '</section></body></html>',
  );
  const el = document.querySelector('section'),
    data = { route: '/index.html', template: el.outerHTML, fields: domain.fieldsFor(el) };
  const collection = getCollection(data);
  assert.equal(collection.type, 'instagram');
  assert.equal(collection.items.length, 4);
  collection.items.reverse();
  collection.items[0].image = 'https://example.com/imagem.jpg';
  applyCollection(data, collection);
  assert.ok(domain.rendered(data).includes('data-mode="manual"'));
  assert.ok(domain.rendered(data).includes('https://example.com/imagem.jpg'));
  const invalid = structuredClone(collection);
  invalid.items[0].link = 'https://example.com/nao-e-instagram';
  assert.throws(() => applyCollection(data, invalid));
});
test('cadastro aceita imagem por URL e não duplica a imagem do curso', async () => {
  const { load, prisma } = context(),
    { createContent } = load('lib/admin-content.ts');
  const post = await createContent(
    {
      type: 'noticias',
      title: 'Imagem por link',
      body: 'Apresentação.',
      image: 'https://example.com/capa.jpg',
    },
    1n,
  );
  const entry = await prisma.content_entries.findUnique({ where: { id: BigInt(post) } });
  assert.ok(entry.draft_data.template.includes('https://example.com/capa.jpg'));
  const course = await createContent(
    {
      type: 'course',
      title: 'Curso teste',
      body: 'Curso.',
      duration: '4 anos',
      diploma: 'Bacharelado',
      image: 'https://example.com/curso.jpg',
    },
    1n,
  );
  const row = await prisma.content_entries.findUnique({ where: { id: BigInt(course) } });
  assert.equal(
    (row.draft_data.template.match(/https:\/\/example.com\/curso.jpg/g) || []).length,
    1,
  );
});
test('origem considera o host público do Next e continua bloqueando outros sites', async () => {
  const { load } = context(),
    { adminHandler } = load('lib/admin-api.ts');
  const request = (origin) =>
    new Request('http://localhost:3000/api/admin/recovery', {
      method: 'POST',
      headers: { Host: '127.0.0.1:3000', Origin: origin },
    });
  assert.equal((await adminHandler(request('http://127.0.0.1:3000'))).status, 404);
  assert.equal((await adminHandler(request('https://outro.example'))).status, 403);
});

test('CMS publica galeria, botão e PDF, conserva rascunhos e ordena pela data escolhida', async () => {
  const { load, prisma } = context();
  const { createContent, saveSection, contentAction } = load('lib/admin-content.ts');
  const blocks = [
    {
      id: 's',
      type: 'section',
      title: 'Título',
      subtitle: 'Subtítulo',
      text: '<p>Texto <strong>formatado</strong></p><script>ruim()</script>',
    },
    {
      id: 'g',
      type: 'gallery',
      images: [
        { url: '/a.jpg', caption: 'Foto A' },
        { url: '/b.jpg', caption: 'Foto B' },
      ],
    },
    { id: 'b', type: 'button', title: 'Inscreva-se', url: '/vestibular' },
    { id: 'd', type: 'document', title: 'Edital', url: '/uploads/edital.pdf' },
  ];
  const id = BigInt(
    await createContent(
      {
        type: 'noticias',
        title: 'Teste de blocos',
        publicationBlocks: blocks,
        publicationDate: '2026-10-01T15:00:00.000Z',
      },
      1n,
    ),
  );
  let entry = await prisma.content_entries.findUnique({ where: { id } });
  assert.equal(entry.published_data, null);
  assert.ok(!entry.draft_data.template.includes('<script'));
  assert.ok(entry.draft_data.template.includes('/b.jpg'));
  assert.ok(entry.draft_data.template.includes('edital.pdf'));
  await contentAction(id, 'publish', 1n);
  entry = await prisma.content_entries.findUnique({ where: { id } });
  assert.equal(entry.published_at.toISOString(), '2026-10-01T15:00:00.000Z');
  await saveSection(
    id,
    {
      revision: entry.revision,
      values: entry.draft_data.fields.map((f) => f.value),
      documents: [],
      publicationBlocks: [...blocks].reverse(),
      publicationDate: '2026-10-16T15:00:00.000Z',
    },
    1n,
  );
  entry = await prisma.content_entries.findUnique({ where: { id } });
  assert.equal(entry.published_at.toISOString(), '2026-10-01T15:00:00.000Z');
  assert.equal(entry.draft_data.publicationBlocks[0].type, 'document');
  await contentAction(id, 'publish', 1n);
  entry = await prisma.content_entries.findUnique({ where: { id } });
  assert.equal(entry.published_at.toISOString(), '2026-10-16T15:00:00.000Z');
  const { renderPublicationBlocks } = load('lib/publication-blocks.ts');
  assert.throws(() => renderPublicationBlocks([{ type: 'button', url: 'javascript:alert(1)' }]));
  assert.throws(() => renderPublicationBlocks([{ type: 'image', url: 'data:text/html,ruim' }]));
});
test('curso apresenta formação, valor, incentivos, professores e complementos na ordem de decisão', async () => {
  const { load } = context();
  const fs = require('fs');
  const { parseHTML } = require('linkedom');
  const { page } = load('lib/content-store.ts');
  const html = await page(
    fs.readFileSync(path.join(root, 'dist/cursos/administracao.html'), 'utf8'),
    '/cursos/administracao.html',
  );
  const { document } = parseHTML(html);
  assert.ok(
    document
      .querySelector('.course-panels > .course-content-section h2')
      .textContent.includes('Sobre o curso'),
  );
  assert.ok(document.querySelector('.course-panels .course-investment .price-grid strong'));
  assert.equal(document.querySelector('.teacher-grid').closest('details'), null);
  assert.equal(document.querySelector('.course-investment').closest('details'), null);
  const details = [...document.querySelectorAll('.course-detail')];
  assert.ok(details.length >= 3);
  assert.equal(document.querySelectorAll('.course-career-highlights > section').length, 3);
  assert.equal(document.querySelector('.course-career-highlights').closest('details'), null);
  assert.ok(details.every((d) => !d.hasAttribute('open')));
  assert.ok(details.some((d) => d.querySelector('summary').textContent === 'Infraestrutura'));
  assert.ok(
    document
      .querySelector('.teacher-grid img')
      .getAttribute('src')
      .startsWith('/assets/documentos/'),
  );
  assert.equal(
    document.querySelector('.nav-trigger[href="/institucional"]').textContent,
    'Instituição',
  );
  assert.ok(document.querySelector('.nav-toggle'));
  assert.equal(document.querySelectorAll('.teacher-carousel-track > article').length, 9);
  assert.equal(document.querySelectorAll('[data-teacher-direction]').length, 2);
  assert.ok(
    document.querySelector('.course-investment').nextElementSibling.hasAttribute('data-benefits'),
  );
});
