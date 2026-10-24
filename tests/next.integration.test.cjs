const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
process.loadEnvFile('.env.local');
const db = require('../cms/db.cjs'),
  auth = require('../cms/auth.cjs');
if (!/_test$/.test(process.env.MYSQL_DATABASE || '')) {
  test('Integração com escrita exige um banco exclusivo de testes', { skip: true }, () => {});
  return;
}
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
test('Next: autenticação, edição, publicação, ocultação e recuperação com dados isolados', async () => {
  const token = crypto.randomBytes(6).toString('hex'),
    email = 'next-test-' + token + '@example.invalid',
    password = 'Teste-local-' + crypto.randomBytes(18).toString('hex');
  let userId;
  const ids = [];
  let cookie = '';
  async function request(endpoint, method = 'GET', data) {
    const response = await fetch(base + '/api/admin/' + endpoint, {
      method,
      headers: { Origin: base, 'Content-Type': 'application/json', Cookie: cookie },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    return { status: response.status, data: await response.json(), response };
  }
  try {
    assert.equal((await request('sections')).status, 401);
    const [user] = await db.execute(
      "INSERT INTO admin_users(name,email,password_hash,role) VALUES (?,?,?,'administrator')",
      ['Validação Next', email, await auth.password(password)],
    );
    userId = user.insertId;
    const login = await request('login', 'POST', { email, password });
    assert.equal(login.status, 200);
    cookie = login.response.headers.get('set-cookie').split(';')[0];
    const list = await request('sections');
    assert.equal(list.status, 200);
    assert.ok(list.data.length > 10);
    assert.ok(list.data.every((e) => typeof e.id === 'number'));
    const create = await request('catalog', 'POST', {
      type: 'course',
      title: 'Teste Next ' + token,
      duration: '4 anos',
      diploma: 'Bacharelado',
      mode: 'Presencial',
      period: 'Noturno',
      body: 'Conteúdo de teste isolado.',
    });
    assert.equal(create.status, 201);
    ids.push(create.data.id);
    const get = await request('sections/' + ids[0]);
    assert.equal(get.status, 200);
    assert.ok(Array.isArray(get.data.fieldGroups));
    let section = get.data;
    const url = section.route.replace(/\.html$/, '');
    assert.equal((await fetch(base + url)).status, 404);
    const save = await request('sections/' + section.id, 'PUT', {
      revision: section.revision,
      values: section.fields.map((f) => f.value),
      documents: [],
    });
    assert.equal(save.status, 200);
    assert.equal(
      (
        await request('sections/' + section.id, 'PUT', {
          revision: section.revision,
          values: section.fields.map((f) => f.value),
          documents: [],
        })
      ).status,
      409,
    );
    assert.equal((await request('sections/' + section.id + '/publish', 'POST')).status, 200);
    assert.equal((await fetch(base + url)).status, 200);
    assert.equal((await fetch(base + section.route, { redirect: 'manual' })).status, 308);
    assert.equal((await request('sections/' + section.id + '/hide', 'POST')).status, 200);
    assert.equal((await fetch(base + url)).status, 404);
    assert.equal((await request('sections/' + section.id + '/trash', 'POST')).status, 200);
    const trashed = (await request('sections')).data.find((e) => e.id === section.id);
    assert.ok(trashed.trashedAt);
    assert.equal((await request('sections/' + section.id + '/publish', 'POST')).status, 410);
    assert.equal((await request('sections/' + section.id + '/restore', 'POST')).status, 200);
    assert.equal((await request('sections')).data.find((e) => e.id === section.id).status, 'draft');
    assert.equal((await fetch(base + url)).status, 404);
    const account = await request('account', 'PUT', { name: 'Validação atualizada' });
    assert.equal(account.status, 200);
    assert.equal((await request('status')).data.user.name, 'Validação atualizada');
    assert.equal(
      (
        await request('account', 'PUT', {
          name: 'Validação atualizada',
          currentPassword: 'errada',
          newPassword: 'Nova-senha-de-teste-12345',
          confirmPassword: 'Nova-senha-de-teste-12345',
        })
      ).status,
      400,
    );
    const blocked = await fetch(base + '/api/admin/account', {
      method: 'PUT',
      headers: {
        Origin: 'https://invalid.example',
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ name: 'Não salvar' }),
    });
    assert.equal(blocked.status, 403);
    assert.equal((await request('logout', 'POST')).status, 200);
    assert.equal((await request('sections')).status, 401);
  } finally {
    for (const id of ids) {
      await db.execute('DELETE FROM audit_events WHERE entity_id=? AND user_id=?', [
        String(id),
        userId,
      ]);
      await db.execute('DELETE FROM content_entries WHERE id=?', [id]);
    }
    if (userId) {
      await db.execute('DELETE FROM audit_events WHERE user_id=?', [userId]);
      await db.execute('DELETE FROM admin_users WHERE id=?', [userId]);
    }
    await db.end();
  }
});
