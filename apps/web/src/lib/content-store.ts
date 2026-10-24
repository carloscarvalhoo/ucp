import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma';
import { Prisma } from '@/generated/prisma/client';
import { projectRoot } from './services-env';
import {
  normalizeDocument,
  parseHTML,
  rendered,
  fieldsFor,
  groupsFor,
  asData,
  jsonData,
  type ContentData,
} from './content-domain';
export { fieldsFor, groupsFor, rendered };
export async function purgeTrash() {
  const rows = await prisma.content_entries.findMany({
    where: { status: 'archived' },
    select: { id: true, draft_data: true, revision: true },
  });
  for (const entry of rows) {
    const d = asData(entry.draft_data);
    if (!d.trashedAt || d.purged || Date.now() < Date.parse(d.trashedAt) + 30 * 86400000) continue;
    await prisma.$transaction(async (tx) => {
      const result = await tx.content_entries.updateMany({
        where: { id: entry.id, revision: entry.revision, status: 'archived' },
        data: {
          draft_data: jsonData({
            route: d.route,
            selector: d.selector,
            trashedAt: d.trashedAt,
            purged: true,
            fields: [],
            documents: [],
          }),
          published_data: Prisma.DbNull,
          revision: { increment: 1 },
        },
      });
      if (result.count) await tx.content_revisions.deleteMany({ where: { entry_id: entry.id } });
    });
  }
}
function order(
  a: { id: bigint; published_data: unknown },
  b: { id: bigint; published_data: unknown },
) {
  return (
    (asData(a.published_data)?.order ?? Number(a.id)) -
    (asData(b.published_data)?.order ?? Number(b.id))
  );
}
export async function publishedCourses() {
  const entries = await prisma.content_entries.findMany({
    where: { status: 'published', kind: { in: ['section', 'course'] } },
    orderBy: { id: 'asc' },
  });
  return entries
    .filter((e) => asData(e.published_data)?.route?.startsWith('/cursos/'))
    .map((entry) => {
      const data = asData(entry.published_data),
        { document } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
      const hero = document.querySelector('.course-hero');
      if (!hero) return null;
      const facts = Array.from(hero.querySelectorAll('.course-summary > span')) as any[];
      const value = (name: string, fallback: string) =>
        facts.find((el) => el.querySelector('small')?.textContent === name)?.querySelector('strong')
          ?.textContent ||
        hero.querySelector(fallback)?.textContent ||
        '';
      const img = hero.querySelector('img');
      return {
        name: hero.querySelector('h1')?.textContent || entry.title,
        image: img?.getAttribute('src') || '/assets/campus.jpg',
        imageAlt: img?.getAttribute('alt') || entry.title,
        mode: hero.querySelector('.course-mode')?.textContent || 'Presencial',
        diploma: value('Diploma', '[data-course-diploma]'),
        duration: value('Duração', '[data-course-duration]'),
        period: value('Período', '[data-course-period]'),
        url: data.route,
      };
    })
    .filter(Boolean);
}
async function decorate(
  document: any,
  route: string,
  override?: { id: number; kind: string; data: ContentData },
) {
  if (route === '/index.html' || route === '/') {
    let banners: { id: bigint; published_data: unknown }[] = await prisma.content_entries.findMany({
      where: { kind: 'banner', status: 'published' },
    });
    if (override?.kind === 'banner') {
      banners = banners.filter((e) => Number(e.id) !== override.id);
      banners.push({
        id: BigInt(override.id),
        published_data: override.data,
      });
    }
    banners.sort(order);
    const hero = document.querySelector('.banner');
    if (hero && !banners.length) hero.remove();
    if (hero && banners.length) {
      hero.replaceChildren();
      for (const [i, banner] of banners.entries()) {
        const { document: fragment } = parseHTML(
          '<html><body>' + rendered(asData(banner.published_data)) + '</body></html>',
        );
        const slide = fragment.body.firstElementChild;
        slide.hidden = i !== 0;
        slide.classList.toggle('active', i === 0);
        hero.append(slide);
      }
      if (banners.length > 1)
        hero.insertAdjacentHTML(
          'beforeend',
          '<button class="banner-arrow prev" data-banner-direction="-1" aria-label="Destaque anterior"><span class="material-icons-outlined" aria-hidden="true">chevron_left</span></button><button class="banner-arrow next" data-banner-direction="1" aria-label="Próximo destaque"><span class="material-icons-outlined" aria-hidden="true">chevron_right</span></button><div class="banner-dots">' +
            banners
              .map(
                (_, i) =>
                  '<button data-banner-index="' +
                  i +
                  '" aria-label="Ir para destaque ' +
                  (i + 1) +
                  '" aria-pressed="' +
                  (i === 0) +
                  '"></button>',
              )
              .join('') +
            '</div>',
        );
    }
  }
  const overview: Record<string, string> = {
    Instituição: '/institucional',
    Cursos: '/cursos',
    'Pós-Graduação': '/pos-graduacao',
    'Pós-graduação': '/pos-graduacao',
    Alunos: '/utilidades',
    Utilidades: '/utilidades',
    'Como ingressar': 'https://ucp.ucpparana.edu.br/vestibular-de-verao-2026-2-pagina-inicial',
  };
  for (const trigger of document.querySelectorAll('.nav-trigger')) {
    const name = trigger.textContent.trim(),
      href = overview[name];
    if (!href) continue;
    const a = document.createElement('a');
    a.className = 'nav-trigger';
    a.textContent = name;
    a.href = href;
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Abrir opções de ' + name);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span aria-hidden="true">⌄</span>';
    trigger.replaceWith(a);
    a.after(toggle);
  }
  const conciseMenus: Record<string, string[][]> = {
    Instituição: [
      ['Visão geral', '/institucional'],
      ['Direção', '/institucional/direcao'],
      ['Corpo docente', '/institucional/corpo-docente'],
      ['Infraestrutura', '/institucional/instalacoes-academicas'],
      ['Extensão', '/extensao-ucp'],
      ['Publicações institucionais', '/institucional/publicacoes-legais'],
      ['CPA', '/cpa-avaliacao'],
      ['Contato', '/contato'],
    ],
    Utilidades: [
      ['Visão geral', '/utilidades'],
      ['Horários de aulas', '/utilidades/horarios-2026-2'],
      ['Ensalamento', '/utilidades/ensalamento-2026-2'],
      ['Calendário acadêmico', '/utilidades/calendario-academico'],
      ['Biblioteca', '/institucional/biblioteca-ucp'],
      ['Manuais', '/utilidades/manuais'],
      ['Editais', '/utilidades/editais'],
      ['Bolsas e incentivos', '/utilidades/incentivos'],
    ],
  };
  for (const nav of document.querySelectorAll('.nav-group')) {
    const items = conciseMenus[nav.querySelector('.nav-trigger')?.textContent.trim()];
    const menu = nav.querySelector('.dropdown');
    if (!items || !menu) continue;
    menu.replaceChildren();
    for (const [title, url] of items) {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = title;
      menu.append(a);
    }
    menu.style.setProperty('--menu-rows', '3');
  }
  const courses = await publishedCourses();
  for (const nav of document.querySelectorAll('.nav-group')) {
    if (nav.querySelector('.nav-trigger')?.textContent.trim() !== 'Cursos') continue;
    const menu = nav.querySelector('.dropdown');
    if (!menu) continue;
    menu.replaceChildren();
    const overview = document.createElement('a');
    overview.href = '/cursos';
    overview.textContent = 'Visão geral';
    menu.append(overview);
    for (const course of courses) {
      if (!course) continue;
      const a = document.createElement('a');
      a.href = course.url;
      if (course.mode === 'Smart') continue;
      a.textContent = course.name;
      menu.append(a);
    }
    const smart = courses.filter((c) => c?.mode === 'Smart');
    if (smart.length) {
      const title = document.createElement('a');
      title.className = 'smart-menu-title';
      title.href = '/cursos-smart';
      title.textContent = 'Smart · Campo Real — Polo UCP';
      menu.append(title);
      for (const course of smart) {
        if (!course) continue;
        const a = document.createElement('a');
        a.href = course.url;
        a.textContent = course.name;
        menu.append(a);
      }
    }
    const links = Array.from(menu.children) as any[];
    menu.replaceChildren();
    menu.classList.add('course-menu-sections');
    const presencial = document.createElement('div');
    presencial.className = 'course-menu-grid';
    const smartGrid = document.createElement('div');
    smartGrid.className = 'course-menu-grid';
    let inSmart = false;
    for (const el of links) {
      if (el.classList.contains('smart-menu-title')) {
        inSmart = true;
        continue;
      }
      (inSmart ? smartGrid : presencial).append(el);
    }
    menu.append(presencial);
    const smartTitle = links.find((el) => el.classList.contains('smart-menu-title'));
    if (smartTitle) {
      menu.append(smartTitle, smartGrid);
    }
  }
  const publicationSections: Record<string, { label: string; overview: string }> = {
    Notícias: { label: 'Notícias', overview: '/noticias' },
    Blog: { label: 'Blog', overview: '/blog' },
    Eventos: { label: 'Eventos', overview: '/eventos' },
  };
  for (const anchor of document.querySelectorAll('header a')) {
    const section = publicationSections[anchor.textContent.trim()];
    if (!section || anchor.closest('.nav-group') || !anchor.parentElement?.matches('nav')) continue;
    const latest = await prisma.content_entries.findMany({
      where: {
        kind: 'publication',
        status: 'published',
        published_data: { path: '$.route', string_starts_with: section.overview + '/' },
      },
      orderBy: { published_at: 'desc' },
      take: 5,
    });
    if (!latest.length) continue;
    const group = document.createElement('div');
    group.className = 'nav-group mega-menu';
    const trigger = document.createElement('a');
    trigger.className = 'nav-trigger';
    trigger.textContent = section.label;
    trigger.href = section.overview;
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Abrir opções de ' + section.label);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span aria-hidden="true">⌄</span>';
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.style.setProperty('--menu-columns', '1');
    dropdown.style.setProperty('--menu-rows', String(latest.length + 1));
    const overview = document.createElement('a');
    overview.href = section.overview;
    overview.textContent = 'Visão geral';
    dropdown.append(overview);
    for (const entry of latest) {
      const data = asData(entry.published_data);
      const a = document.createElement('a');
      a.href = data.route;
      a.textContent = entry.title;
      dropdown.append(a);
    }
    group.append(trigger, toggle, dropdown);
    anchor.replaceWith(group);
  }
}
export async function page(
  html: string,
  route: string,
  override?: { id: number; kind: string; data: ContentData },
) {
  route = route === '/' ? '/index.html' : route;
  const entries = await prisma.content_entries.findMany({
    where: {
      OR: [
        { kind: 'shared' },
        {
          kind: { in: ['section', 'publication', 'course', 'page'] },
          draft_data: { path: '$.route', equals: route },
        },
      ],
    },
  });
  const { document } = parseHTML(html);
  const hidden = entries.filter(
    (e) => e.status !== 'published' && e.kind !== 'shared' && Number(e.id) !== override?.id,
  );
  const removed = hidden
    .map((e) => document.querySelector(asData(e.draft_data).selector))
    .filter(Boolean);
  for (const el of removed) el.remove();
  for (const entry of entries) {
    const data =
      Number(entry.id) === override?.id
        ? override.data
        : entry.status === 'published'
          ? asData(entry.published_data)
          : null;
    if (!data) continue;
    const old = document.querySelector(data.selector);
    if (old) {
      const { document: fragment } = parseHTML('<html><body>' + rendered(data) + '</body></html>');
      old.replaceWith(fragment.body.firstElementChild);
    }
  }
  if (
    override &&
    !entries.some((e) => Number(e.id) === override.id) &&
    ['page', 'course', 'publication'].includes(override.kind)
  ) {
    const { document: fragment } = parseHTML(
      '<html><body>' + rendered(override.data) + '</body></html>',
    );
    document.querySelector('main')?.replaceWith(fragment.body.firstElementChild);
  }
  if (['/noticias.html', '/blog.html', '/eventos.html'].includes(route)) {
    const posts = await prisma.content_entries.findMany({
      where: {
        kind: 'publication',
        status: 'published',
        published_data: { path: '$.contentType', equals: route.slice(1, -5) },
      },
      orderBy: { published_at: 'desc' },
    });
    const main = document.querySelector('main');
    if (main)
      for (const child of Array.from(main.children) as any[])
        if (!child.classList.contains('page-heading')) child.remove();
    if (!posts.length && main) {
      const section = document.createElement('section');
      section.className = 'wrap section publication-empty';
      const p = document.createElement('p');
      p.textContent = 'Nenhuma publicação por enquanto.';
      section.append(p);
      main.append(section);
    }
    if (posts.length) {
      const section = document.createElement('section');
      section.className = 'wrap section';
      const title = document.createElement('h2');
      title.textContent = 'Publicações recentes';
      section.append(title);
      const grid = document.createElement('div');
      grid.className = 'directory-grid';
      for (const post of posts) {
        const a = document.createElement('a');
        a.href = asData(post.published_data).route;
        const h = document.createElement('h2');
        h.textContent = post.title;
        const data = asData(post.published_data);
        const { document: contentDoc } = parseHTML(
          '<html><body>' + rendered(data) + '</body></html>',
        );
        const cover = contentDoc.querySelector('article img');
        if (cover) {
          const img = document.createElement('img');
          img.src = cover.getAttribute('src');
          img.alt = cover.getAttribute('alt') || post.title;
          img.loading = 'lazy';
          a.append(img);
        }
        a.append(h);
        if (post.published_at) {
          const time = document.createElement('time');
          time.dateTime = post.published_at.toISOString();
          time.textContent = post.published_at.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
          });
          a.append(time);
        }
        grid.append(a);
      }
      section.append(grid);
      document.querySelector('main')?.append(section);
    }
  }
  // Apply presentation without replacing saved course content or drafts.
  if (['/cursos.html', '/cursos-smart.html'].includes(route)) {
    const grid = document.querySelector('[data-course-directory]');
    if (grid) {
      grid.replaceChildren();
      for (const course of await publishedCourses()) {
        if (!course || (course.mode === 'Smart') !== (route === '/cursos-smart.html')) continue;
        const a = document.createElement('a');
        a.href = course.url;
        const img = document.createElement('img');
        img.src = course.image;
        img.alt = course.name;
        img.loading = 'lazy';
        const h = document.createElement('h2');
        h.textContent = course.name;
        const p = document.createElement('p');
        p.textContent = [course.diploma, course.duration, course.period]
          .filter(Boolean)
          .join(' · ');
        a.append(img, h, p);
        grid.append(a);
      }
    }
  }
  if (route.startsWith('/cursos/')) {
    const source = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'content-source.json'), 'utf8'),
    );
    const course = source.courses.find((c: any) => '/cursos/' + c.slug + '.html' === route);
    if (course) {
      const smart = course.mode === 'Smart';
      const mode = document.querySelector('.course-mode');
      if (mode) mode.textContent = smart ? 'Smart · Campo Real · Polo UCP' : 'Graduação presencial';
      const hero = document.querySelector('.course-hero');
      if (smart && hero && !hero.querySelector('.smart-institution')) {
        const p = document.createElement('p');
        p.className = 'smart-institution';
        p.textContent = 'Curso da Campo Real. A UCP é o seu polo de apoio em Pitanga.';
        hero.querySelector('h1')?.after(p);
      }
      for (const teacher of document.querySelectorAll('.teacher-grid article')) {
        const name = teacher.querySelector('h3')?.textContent?.trim();
        const record = course.teachers.find((t: any) => t.name.trim() === name);
        if (record?.image && !teacher.querySelector('img')) {
          const img = document.createElement('img');
          img.src = record.image;
          img.alt = name;
          img.loading = 'lazy';
          teacher.prepend(img);
        }
      }
      for (const grid of document.querySelectorAll('.teacher-grid')) {
        const carousel = document.createElement('div');
        carousel.className = 'teacher-carousel';
        carousel.setAttribute('role', 'region');
        carousel.setAttribute('aria-label', 'Professores do curso');
        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'teacher-carousel-arrow';
        prev.setAttribute('data-teacher-direction', '-1');
        prev.setAttribute('aria-label', 'Professores anteriores');
        prev.innerHTML = '<span aria-hidden="true">‹</span>';
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'teacher-carousel-arrow';
        next.setAttribute('data-teacher-direction', '1');
        next.setAttribute('aria-label', 'Próximos professores');
        next.innerHTML = '<span aria-hidden="true">›</span>';
        grid.classList.add('teacher-carousel-track');
        grid.setAttribute('tabindex', '0');
        grid.setAttribute('aria-label', 'Lista de professores');
        grid.before(carousel);
        carousel.append(prev, grid, next);
      }
      const panels = document.querySelector('.course-panels');
      if (panels) {
        const sections = Array.from(panels.querySelectorAll('.course-content-section')) as any[];
        const named = (name: string) =>
          sections.find((section) => section.querySelector('h2')?.textContent?.trim() === name);
        const investment = named('Investimento');
        if (investment) {
          investment.classList.add('course-investment');
          investment.querySelector('h2').textContent = 'Mensalidade';
          investment.classList.add('course-essential', 'course-investment-inline');
        }
        const coordination = named('Coordenação');
        const assessmentLabel =
          coordination &&
          (Array.from(coordination.querySelectorAll('p,h3,h4')).find(
            (el: any) => el.textContent.trim() === 'Resultados da Avaliação Institucional',
          ) as any);
        if (assessmentLabel) {
          const section = document.createElement('section');
          section.className = 'course-content-section';
          section.id = 'course-assessment';
          const heading = document.createElement('h2');
          heading.textContent = assessmentLabel.textContent;
          section.append(heading);
          let node = assessmentLabel.nextSibling;
          while (node) {
            const next = node.nextSibling;
            section.append(node);
            node = next;
          }
          assessmentLabel.remove();
          panels.append(section);
        }
        const highlights = document.createElement('div');
        highlights.className = 'course-career-highlights';
        for (const name of [
          'Por que fazer este curso?',
          'O que vou fazer?',
          'Onde vou trabalhar?',
        ]) {
          const section = named(name);
          if (!section) continue;
          section.classList.add('course-highlight-card');
          const heading = section.querySelector('h2');
          if (heading) {
            const h = document.createElement('h3');
            h.id = heading.id;
            h.textContent = heading.textContent;
            heading.replaceWith(h);
          }
          highlights.append(section);
        }
        if (highlights.children.length) panels.append(highlights);
        if (investment) panels.append(investment);
        const courseBenefits = document.querySelector('[data-benefits]');
        if (courseBenefits) {
          courseBenefits.classList.add('course-inline-benefits');
          panels.append(courseBenefits);
        }
        for (const name of ['Coordenação', 'Corpo docente']) {
          const section = named(name);
          if (section) {
            section.classList.add('course-essential');
            panels.append(section);
          }
        }
        const more = document.createElement('div');
        more.className = 'course-details-list';
        for (const [index, section] of (
          Array.from(panels.querySelectorAll('.course-content-section')) as any[]
        ).entries()) {
          if (
            index === 0 ||
            section.classList.contains('course-essential') ||
            section.closest('.course-career-highlights')
          )
            continue;
          const heading = section.querySelector('h2');
          if (!heading) continue;
          const details = document.createElement('details');
          details.className = 'course-detail';
          details.id = section.id;
          const summary = document.createElement('summary');
          summary.textContent = heading.textContent;
          details.append(summary);
          const body = document.createElement('div');
          body.className = 'course-detail-body';
          for (const child of Array.from(section.childNodes))
            if (child !== heading) body.append(child);
          details.append(body);
          more.append(details);
          section.remove();
        }
        panels.append(more);
        const cta = document.querySelector('.course-cta .wrap');
        if (cta) {
          cta.replaceChildren();
          const heading = document.createElement('h2');
          heading.textContent = 'Pronto para dar o próximo passo?';
          const actions = document.createElement('div');
          actions.className = 'course-final-actions';
          const enroll = document.createElement('a');
          enroll.className = 'solid-button';
          enroll.href = hero?.querySelector('.solid-button')?.getAttribute('href') || '/contato';
          enroll.textContent = 'Inscreva-se no vestibular';
          const contact = document.createElement('a');
          contact.className = 'outline-button';
          contact.href = '/contato/coordenacao';
          contact.textContent = 'Tire suas dúvidas';
          actions.append(enroll, contact);
          cta.append(heading, actions);
        }
      }
    }
  }
  normalizeDocument(document);
  await decorate(document, route, override);
  for (const card of document.querySelectorAll('#quick-track .quick-card'))
    if (
      ['Apoio acadêmico', 'Cursos de graduação', 'Cursos de pós-graduação'].includes(
        card.querySelector('h2')?.textContent.trim(),
      )
    )
      card.remove();
  document.querySelectorAll('[data-benefit-pause]').forEach((el: any) => el.remove());
  for (const card of document.querySelectorAll('#projetos .project-card'))
    if (card.querySelector('h3')?.textContent.trim() === 'Bolsas e incentivos') card.remove();
  const heading = document.querySelector('#projetos h2');
  if (heading) heading.textContent = 'Apoio e atendimento';
  const social = document.querySelector('.social-links'),
    tiktok = social?.querySelector('.social-placeholder'),
    youtube = social?.querySelector('[data-video]');
  if (tiktok && youtube) social.insertBefore(tiktok, youtube);
  document
    .querySelectorAll('#quick-track a[href="https://ucpparana.edu.br/?p=34365"]')
    .forEach((el: any) => el.remove());
  const aliases = JSON.parse(
    await fs.readFile(path.join(projectRoot, 'url-aliases.json'), 'utf8'),
  ) as Record<string, string>;
  for (const anchor of document.querySelectorAll('a[href]')) {
    try {
      const url = new URL(anchor.getAttribute('href'));
      const hash = url.hash;
      url.hash = '';
      url.protocol = 'https:';
      url.hostname = url.hostname.replace(/^www\./, '');
      url.searchParams.sort();
      if (!url.search && !/\.[a-z0-9]+$/i.test(url.pathname))
        url.pathname = url.pathname.replace(/\/$/, '') || '/';
      if (aliases[url.href]) anchor.setAttribute('href', aliases[url.href] + hash);
    } catch {}
  }
  let assets: Record<string, { file?: string }> = {};
  try {
    assets = JSON.parse(
      await fs.readFile(path.join(projectRoot, 'institutional-assets.json'), 'utf8'),
    );
  } catch {}
  for (const el of document.querySelectorAll('[href],[src]'))
    for (const attr of ['href', 'src']) {
      const local = assets[el.getAttribute(attr)?.split('#')[0]]?.file;
      if (local)
        el.setAttribute(
          attr,
          local +
            (el.getAttribute(attr).includes('#')
              ? '#' + el.getAttribute(attr).split('#').slice(1).join('#')
              : ''),
        );
    }
  for (const element of document.querySelectorAll('[href],[src],[poster],[action]')) {
    for (const attr of ['href', 'src', 'poster', 'action']) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      try {
        const url = new URL(value, 'https://local.invalid');
        if (!/^(www\.)?ucpparana\.edu\.br$/i.test(url.hostname)) continue;
        element.removeAttribute(attr);
        if (attr === 'href' && element.classList.contains('resource-card')) element.remove();
        if (attr === 'src' && element.tagName === 'IMG') element.remove();
      } catch {}
    }
  }
  for (const note of document.querySelectorAll('.service-note')) {
    if (!note.querySelector('a[href]'))
      note.innerHTML =
        '<h2>Precisa de atendimento?</h2><p>Consulte os canais de atendimento da UCP para informações e solicitações.</p><a class="solid-button" href="/contato">Contato e atendimento →</a>';
  }
  return document.toString();
}
export async function runtime(script: string) {
  const entries = await prisma.content_entries.findMany({
    where: { kind: 'runtime', status: 'published' },
  });
  for (const entry of entries) {
    const data = asData(entry.published_data);
    if (data.key === 'ucpCourses') continue;
    const value = structuredClone(data.value);
    for (const field of data.fields) {
      let target: any = value;
      for (const key of field.path.slice(0, -1)) target = target?.[key];
      if (target) target[field.path.at(-1)!] = field.value;
    }
    script += '\nwindow.' + data.key + '=' + JSON.stringify(value).replace(/</g, '\\u003c') + ';';
  }
  script +=
    '\nwindow.ucpCourses=' +
    JSON.stringify(await publishedCourses()).replace(/</g, '\\u003c') +
    ';';
  return script;
}
