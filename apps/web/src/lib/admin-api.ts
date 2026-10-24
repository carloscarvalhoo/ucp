import { getTextBlocks } from './text-blocks';
import { getCollection } from './collections';
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { prisma } from './prisma';
import { projectRoot } from './services-env';
import { parseHTML, asData, groupsFor, publicURL, jsonData } from './content-domain';
import * as content from './content-store';
import {
  currentUser,
  publicUser,
  createSession,
  sessionCookie,
  sessionToken,
  hash,
  password,
  verify,
  rateLimit,
  clearAttempts,
} from './admin-auth';
import { createContent, saveSection, contentAction } from './admin-content';
const headers = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};
function json(data: unknown, status = 200, cookie?: string) {
  return Response.json(data, {
    status,
    headers: { ...headers, ...(cookie ? { 'Set-Cookie': cookie } : {}) },
  });
}
async function body(request: Request): Promise<Record<string, any>> {
  let size = 0;
  const reader = request.body?.getReader();
  if (!reader) return {};
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 15 * 1024 * 1024) {
      await reader.cancel();
      throw Error('Arquivo muito grande. Limite: 10 MB.');
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  const parsed = JSON.parse(text || '{}');
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
    throw Error('Dados inválidos.');
  return parsed;
}
async function listEntries() {
  await content.purgeTrash();
  const all = await prisma.content_entries.findMany({
    where: { slug: { not: '/index.html:home-0' } },
    orderBy: [{ kind: 'asc' }, { title: 'asc' }],
  });
  const { document } = parseHTML(
    await fs.readFile(path.join(projectRoot, 'dist/index.html'), 'utf8'),
  );
  return all.flatMap((entry) => {
    const data = asData(entry.draft_data);
    if (data.purged || (entry.kind === 'runtime' && data.key === 'ucpCourses')) return [];
    if (
      entry.kind === 'section' &&
      data.route === '/index.html' &&
      entry.revision === 1 &&
      data.selector &&
      !document.querySelector(data.selector)
    )
      return [];
    let title = entry.title;
    if (
      entry.kind === 'section' &&
      data.route === '/index.html' &&
      entry.revision === 1 &&
      data.selector
    ) {
      const block = document.querySelector(data.selector);
      title =
        block?.id === 'alunos'
          ? 'Acessos rápidos'
          : block?.id === 'projetos'
            ? 'Apoio e atendimento'
            : block?.querySelector('h2')?.textContent || title;
    }
    return [
      {
        id: Number(entry.id),
        title,
        kind: entry.kind,
        status: entry.status,
        revision: entry.revision,
        route: data.route,
        trashedAt: data.trashedAt,
        purged: data.purged,
        order: data.order,
      },
    ];
  });
}
async function uploadFile(input: Record<string, unknown>) {
  if (typeof input.base64 !== 'string' || input.base64.length > 14 * 1024 * 1024)
    throw Error('Arquivo inválido ou muito grande.');
  const buffer = Buffer.from(input.base64, 'base64');
  if (buffer.length > 10 * 1024 * 1024) throw Error('O arquivo deve ter até 10 MB.');
  let ext: string, mime: string;
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    ext = 'jpg';
    mime = 'image/jpeg';
  } else if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    ext = 'png';
    mime = 'image/png';
  } else if (
    buffer.subarray(0, 4).toString() === 'RIFF' &&
    buffer.subarray(8, 12).toString() === 'WEBP'
  ) {
    ext = 'webp';
    mime = 'image/webp';
  } else if (buffer.subarray(0, 5).toString() === '%PDF-') {
    ext = 'pdf';
    mime = 'application/pdf';
  } else throw Error('Use imagem JPG, PNG, WebP ou documento PDF.');
  let finalBuffer = buffer;
  if (ext === 'jpg' || ext === 'png' || ext === 'webp') {
    try {
      const sharp = (await import('sharp')).default;
      const image = sharp(buffer);
      const meta = await image.metadata();
      let pipeline = image;
      if (meta.width && meta.width > 1920) pipeline = pipeline.resize({ width: 1920 });
      const compressed = await (ext === 'jpg'
        ? pipeline.jpeg({ quality: 80, mozjpeg: true })
        : ext === 'png'
          ? pipeline.png({ quality: 80, compressionLevel: 9 })
          : pipeline.webp({ quality: 80 })
      ).toBuffer();
      if (compressed.length < buffer.length) finalBuffer = compressed;
    } catch {
      // mantém o arquivo original se a compressão falhar
    }
  }
  const name = crypto.randomUUID() + '.' + ext,
    dir = path.join(projectRoot, 'storage/uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), finalBuffer);
  try {
    await prisma.media_assets.create({
      data: {
        storage_key: 'uploads/' + name,
        original_name: String(input.name || name).slice(0, 255),
        mime_type: mime,
        byte_size: BigInt(finalBuffer.length),
      },
    });
  } catch (error) {
    await fs.unlink(path.join(dir, name)).catch(() => {});
    throw error;
  }
  return { url: '/uploads/' + name, name: input.name };
}
export async function adminHandler(request: Request) {
  try {
    const url = new URL(request.url),
      endpoint = url.pathname.slice('/api/admin/'.length);
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method))
      return json({ error: 'Método não permitido.' }, 405);
    const publicOrigin = new URL(url.origin);
    if (request.headers.get('host')) publicOrigin.host = request.headers.get('host')!;
    if (request.method !== 'GET' && request.headers.get('origin') !== publicOrigin.origin)
      return json({ error: 'Origem não autorizada.' }, 403);
    if (endpoint === 'status' && request.method === 'GET')
      return json({
        setup: (await prisma.admin_users.count()) === 0,
        user: publicUser(await currentUser(request)),
        recoveryAvailable: false,
      });
    if (['login', 'setup'].includes(endpoint) && request.method === 'POST') {
      const key = 'login:' + (request.headers.get('x-forwarded-for') || 'local');
      if (!(await rateLimit(key)))
        return json({ error: 'Aguarde alguns minutos antes de tentar novamente.' }, 429);
      const input = await body(request);
      if (
        typeof input.email !== 'string' ||
        typeof input.password !== 'string' ||
        input.password.length > 256
      )
        return json({ error: 'Informe e-mail e senha.' }, 400);
      const email = input.email.trim().toLowerCase();
      if (endpoint === 'setup') {
        if (
          input.password.length < 12 ||
          typeof input.name !== 'string' ||
          !input.name.trim() ||
          !/^\S+@\S+\.\S+$/.test(email)
        )
          return json(
            { error: 'Preencha nome, e-mail e uma senha com pelo menos 12 caracteres.' },
            400,
          );
        const result = await prisma.$transaction(
          async (tx) => {
            if (await tx.admin_users.count()) throw Error('SETUP_CLOSED');
            return tx.admin_users.create({
              data: {
                name: input.name.trim().slice(0, 150),
                email,
                password_hash: await password(input.password),
                role: 'administrator',
              },
            });
          },
          { isolationLevel: 'Serializable' },
        );
        return json({ ok: true }, 201, sessionCookie(await createSession(result.id)));
      }
      const user = await prisma.admin_users.findUnique({ where: { email } });
      if (!user?.active || !(await verify(input.password, user.password_hash)))
        return json({ error: 'E-mail ou senha inválidos.' }, 401);
      await clearAttempts(key);
      return json({ ok: true }, 200, sessionCookie(await createSession(user.id)));
    }
    if (endpoint === 'recovery' || /^users(?:\/|$)/.test(endpoint))
      return json({ error: 'Recurso não encontrado.' }, 404);
    const user = await currentUser(request);
    if (!user) return json({ error: 'Entre no painel para continuar.' }, 401);
    if (endpoint === 'logout' && request.method === 'POST') {
      const token = sessionToken(request);
      if (token) await prisma.admin_sessions.deleteMany({ where: { id_hash: hash(token) } });
      return json({ ok: true }, 200, sessionCookie(''));
    }
    if (endpoint === 'account' && request.method === 'PUT') {
      const input = await body(request);
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 150)
        throw Error('Informe seu nome, com até 150 caracteres.');
      if (input.newPassword || input.currentPassword || input.confirmPassword)
        return json({ error: 'Alteração de senha não disponível no painel.' }, 400);
      await prisma.admin_users.update({
        where: { id: user.id },
        data: { name: input.name.trim() },
      });
      return json({ ok: true });
    }
    if (endpoint === 'sections' && request.method === 'GET') return json(await listEntries());
    if (endpoint === 'upload' && request.method === 'POST')
      return json(await uploadFile(await body(request)), 201);
    if (['catalog', 'publications', 'pages'].includes(endpoint) && request.method === 'POST')
      return json({ id: await createContent(await body(request), user.id) }, 201);
    const match = endpoint.match(
      /^sections\/(\d+)(?:\/(publish|preview|trash|restore|hide|activate))?$/,
    );
    if (match) {
      const id = BigInt(match[1]),
        entry = await prisma.content_entries.findUnique({ where: { id } });
      if (!entry) return json({ error: 'Conteúdo não encontrado.' }, 404);
      const data = asData(entry.draft_data);
      if (data.trashedAt && match[2] !== 'restore')
        return json({ error: 'Este conteúdo está na lixeira.' }, 410);
      if (request.method === 'GET' && match[2] === 'preview') {
        if (entry.kind === 'runtime')
          return json(
            {
              error:
                'A lista de fotos e suas descrições estão disponíveis no editor. Publique para conferir na galeria.',
            },
            400,
          );
        let source: string;
        try {
          source = await fs.readFile(path.join(projectRoot, 'dist', data.route), 'utf8');
        } catch {
          source = await fs.readFile(path.join(projectRoot, 'dist/noticias.html'), 'utf8');
        }
        const html = (
          await content.page(source, data.route, { id: Number(id), kind: entry.kind, data })
        ).replace('<head>', '<head><base href="' + data.route + '">');
        return new Response(html, {
          headers: {
            ...headers,
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Security-Policy': "script-src 'none'; object-src 'none'; form-action 'none'",
          },
        });
      }
      if (request.method === 'GET' && !match[2])
        return json({
          id: Number(id),
          title: entry.title,
          kind: entry.kind,
          status: entry.status,
          revision: entry.revision,
          route: data.route,
          fields: data.fields.map((field) => ({
            ...field,
            hidden: ['image', 'link', 'alt'].includes(field.kind) && !field.value.trim(),
            value: field.kind === 'link' ? publicURL(field.value) : field.value,
          })),
          fieldGroups: groupsFor(data),
          collection: getCollection(data),
          textBlocks: getTextBlocks(data),
          publicationBlocks: data.publicationBlocks || [],
          publicationDate: data.publicationDate || entry.published_at?.toISOString() || '',
          documents: data.documents || [],
        });
      if (request.method === 'PUT' && !match[2])
        return json({ ok: true, revision: await saveSection(id, await body(request), user.id) });
      if (
        request.method === 'POST' &&
        ['publish', 'trash', 'restore', 'hide', 'activate'].includes(match[2])
      )
        return json(await contentAction(id, match[2], user.id));
    }
    return json({ error: 'Recurso não encontrado.' }, 404);
  } catch (error) {
    const e = error as Error & { code?: string };
    if (e.code === 'P2002') return json({ error: 'Este e-mail já está cadastrado.' }, 409);
    if (e.message === 'CONFLICT')
      return json({ error: 'Este conteúdo foi alterado. Recarregue antes de salvar.' }, 409);
    if (e.message === 'SETUP_CLOSED')
      return json({ error: 'O administrador já foi cadastrado.' }, 409);
    if (e.code || !(error instanceof Error)) {
      console.error('CMS:', e.code || 'falha interna');
      return json({ error: 'Não foi possível concluir. Tente novamente.' }, 500);
    }
    return json({ error: e.message }, 400);
  }
}
