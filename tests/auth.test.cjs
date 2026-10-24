const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const auth = require('../cms/auth.cjs');
const db = require('../cms/db.cjs');

test('senhas recebem sal aleatório e não são armazenadas em texto aberto', async () => {
  const value = 'senha-de-teste-com-mais-de-12-caracteres';
  const first = await auth.password(value);
  const second = await auth.password(value);
  assert.notEqual(first, second);
  assert(!first.includes(value));
  assert.equal(await auth.verify(value, first), true);
  assert.equal(await auth.verify('senha-incorreta', first), false);
});

test('hash de senha inválido não concede acesso nem derruba a autenticação', async () => {
  assert.equal(await auth.verify('qualquer-senha', 'registro-invalido'), false);
});

test('requisição sem sessão não recebe identidade de administrador', async () => {
  assert.equal(await auth.user({ headers: {} }), null);
});

after(() => db.end());
