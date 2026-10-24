const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  { parseHTML } = require('linkedom');
const base = process.env.TEST_BASE_URL;
test('Next: páginas do sitemap, links limpos, assets, SEO e 404', { skip: !base }, async () => {
  const sitemap = await fetch(base + '/sitemap.xml');
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  const routes = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => new URL(m[1]).pathname);
  assert.ok(routes.length > 70);
  assert.ok(routes.every((route) => !route.endsWith('.html') && !route.startsWith('/admin')));
  for (let i = 0; i < routes.length; i += 4)
    await Promise.all(
      routes.slice(i, i + 4).map(async (route) => {
        const response = await fetch(base + route);
        assert.equal(response.status, 200, route);
        const { document } = parseHTML(await response.text());
        assert.ok(document.querySelector('title')?.textContent, route);
        assert.equal(
          document.querySelectorAll('header .brand').length,
          1,
          route + ': logo do cabeçalho',
        );
        for (const element of document.querySelectorAll(
          'a[href],img[src],iframe[src],form[action]',
        )) {
          for (const attr of ['href', 'src', 'action']) {
            const value = element.getAttribute(attr);
            assert.ok(
              !/^https?:\/\/(www\.)?ucpparana\.edu\.br(?:\/|$)/i.test(value || ''),
              route + ': destino antigo ' + value,
            );
          }
        }
        for (const brand of document.querySelectorAll('a.brand'))
          assert.equal(brand.getAttribute('href'), '/');
        if (document.querySelector('.inner-layout'))
          assert.equal(
            document.querySelectorAll('main > .inner-layout ~ section').length,
            0,
            route + ': conteúdo fora do layout',
          );
        for (const a of document.querySelectorAll('a[href]')) {
          const href = a.getAttribute('href');
          if (href.startsWith('/'))
            assert.ok(!/\.html(?:[?#]|$)/.test(href), route + ' -> ' + href);
        }
      }),
    );
  for (const asset of [
    '/campo.css',
    '/pages.css',
    '/animations.js',
    '/vendor/gsap.min.js',
    '/assets/ucp-logo-oficial.png',
  ])
    assert.equal((await fetch(base + asset)).status, 200, asset);
  const queryRedirect = await fetch(base + '/cursos/administracao.html?turma=1', {
    redirect: 'manual',
  });
  assert.equal(queryRedirect.headers.get('location'), '/cursos/administracao?turma=1');
  const old = await fetch(base + '/cursos/administracao.html', { redirect: 'manual' });
  assert.equal(old.status, 308);
  assert.equal(old.headers.get('location'), '/cursos/administracao');
  const missing = await fetch(base + '/nao-existe-404-validacao');
  assert.equal(missing.status, 404);
  assert.ok((await missing.text()).includes('404'));
  const admin = await fetch(base + '/admin');
  assert.equal(admin.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.ok((await admin.text()).includes('noindex'));
  const robots = await (await fetch(base + '/robots.txt')).text();
  assert.ok(robots.includes('Disallow: /admin'));
  assert.ok(robots.includes('Disallow: /api/'));
  const home = await (await fetch(base)).text();
  assert.ok(
    home.includes(
      'A UCP Pitanga está localizada no centro do Paraná. Hoje, possui oito cursos de graduação e várias modalidades de bolsas incentivo ao estudo.',
    ),
  );
  console.log(routes.length + ' páginas públicas verificadas.');
});
