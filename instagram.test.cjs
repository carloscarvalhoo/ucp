const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInstagramFeed } = require('./instagram.cjs');
const env = { INSTAGRAM_USERNAME: 'ucpparana' };
function block(n, { video = false, ts } = {}) {
  return (
    '\\"shortcode_media\\":{\\"__typename\\":\\"GraphImage\\",\\"id\\":\\"' +
    n +
    '\\",\\"shortcode\\":\\"post' +
    n +
    '\\",\\"is_video\\":' +
    video +
    ',\\"display_url\\":\\"https:\\/\\/cdn.example\\/' +
    n +
    '.jpg\\",\\"taken_at_timestamp\\":' +
    ts +
    ',\\"edge_media_to_caption\\":{\\"edges\\":[{\\"node\\":{\\"text\\":\\"Post ' +
    n +
    '\\"}}]}}'
  );
}
function embedHTML(blocks) {
  return '<html><script>window.x=' + blocks.join(',') + '</script></html>';
}
test('Seleciona os cinco posts mais recentes da página de embed pública', async () => {
  const blocks = [
    block(1, { ts: 1700000001 }),
    block(6, { ts: 1700000006, video: true }),
    block(3, { ts: 1700000003 }),
    block(7, { ts: 1700000007 }),
    block(5, { ts: 1700000005 }),
    block(2, { ts: 1700000002 }),
    block(4, { ts: 1700000004 }),
  ];
  const get = createInstagramFeed({
    env,
    fetchImpl: async (url) => {
      assert.equal(url, 'https://www.instagram.com/ucpparana/embed/');
      return { ok: true, text: async () => embedHTML(blocks) };
    },
  });
  const feed = await get();
  assert.deepEqual(
    feed.posts.map((x) => x.id),
    ['post7', 'post6', 'post5', 'post4', 'post3'],
  );
  assert.equal(feed.posts[1].type, 'VIDEO');
  assert.equal(feed.posts[0].image, 'https://cdn.example/7.jpg');
  assert.equal(feed.posts[0].permalink, 'https://www.instagram.com/p/post7/');
  assert.equal(feed.posts[0].caption, 'Post 7');
});
test('Reutiliza cache, une consultas concorrentes e preserva o feed após falha', async () => {
  let time = Date.parse('2026-10-16T12:00:00Z'),
    calls = 0;
  const blocks = [block(1, { ts: 1700000001 })];
  const get = createInstagramFeed({
    env,
    now: () => time,
    fetchImpl: async () => {
      calls++;
      if (calls > 1) throw Error('offline');
      return { ok: true, text: async () => embedHTML(blocks) };
    },
  });
  await Promise.all([get(), get()]);
  assert.equal(calls, 1);
  await get();
  assert.equal(calls, 1);
  time += 300001;
  const stale = await get();
  assert.equal(stale.status, 'stale');
  assert.equal(stale.posts.length, 1);
  await get();
  assert.equal(calls, 2);
});
test('Usuário inválido não faz requisições', async () => {
  const feed = await createInstagramFeed({
    env: { INSTAGRAM_USERNAME: '../etc' },
    fetchImpl: () => assert.fail('Não deveria consultar o Instagram'),
  })();
  assert.equal(feed.status, 'unavailable');
  assert.deepEqual(feed.posts, []);
});
test('Página indisponível não derruba o site nem expõe detalhes internos', async () => {
  const feed = await createInstagramFeed({
    env,
    fetchImpl: async () => ({ ok: false, status: 404 }),
  })();
  assert.equal(feed.status, 'unavailable');
  assert.deepEqual(feed.posts, []);
});
