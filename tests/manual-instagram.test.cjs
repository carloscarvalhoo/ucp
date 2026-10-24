const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  { parseHTML } = require('linkedom');
test('feed manual exibe quatro imagens locais e não consulta a API', () => {
  const html = require('../manual-instagram.cjs')(),
    { document } = parseHTML('<html><body>' + html + '</body></html>');
  const feed = document.querySelector('#instagram-feed');
  assert.equal(feed.querySelectorAll('a').length, 4);
  for (const image of feed.querySelectorAll('img'))
    assert.ok(fs.existsSync(path.join(__dirname, '../public', image.getAttribute('src'))));
  let calls = 0;
  const source = fs.readFileSync(path.join(__dirname, '../src/client/campo.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('const instagramFeed =')), {
    document: {
      hidden: false,
      querySelector: (selector) => document.querySelector(selector),
      addEventListener() {},
    },
    fetch: () => {
      calls++;
      throw Error('Não deve consultar API');
    },
    setInterval() {},
    AbortSignal,
  });
  assert.equal(calls, 0);
});
