const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const courses = window.ucpCourses;
const escapeHTML = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const areaForCourse = (course) => {
  if (course.area) return course.area;
  const name = normalize(course.name);
  if (/administracao|direito/.test(name)) return 'Negócios e Direito';
  if (/agronom|agroneg/.test(name)) return 'Agro';
  if (/pedagog|licenciatura/.test(name)) return 'Educação';
  if (/software|tecnolog/.test(name)) return 'Tecnologia';
  if (/medicina|enferm|psicolog|farmacia|fisioter|biomed|educacao fisica/.test(name))
    return 'Saúde';
  return '';
};
const courseTrack = document.querySelector('#course-track');
const courseSearch = document.querySelector('#course-search');
let selectedFilter = 'Todos';
function renderCourses() {
  const visible = courses.filter(
    (course) =>
      ((selectedFilter === 'Todos' && course.mode !== 'Smart') ||
        (course.mode !== 'Smart' && areaForCourse(course) === selectedFilter) ||
        (selectedFilter === 'Smart' && course.mode === 'Smart')) &&
      normalize(course.name).includes(normalize(courseSearch.value.trim())),
  );
  document.querySelector('#results').textContent =
    `${visible.length} ${visible.length === 1 ? 'curso encontrado' : 'cursos encontrados'}`;
  courseTrack.innerHTML = visible.length
    ? visible
        .map(
          (course) =>
            `<article class="course-card"><img src="${escapeHTML(course.image)}" alt="${escapeHTML(course.imageAlt)}" loading="lazy"><div class="course-body"><h3>${escapeHTML(course.name)}${course.mode === 'Smart' ? '<small class="smart-label">Campo Real · Polo UCP</small>' : ''}</h3><div class="course-facts">${course.duration ? `<p><span class="material-icons-outlined" aria-hidden="true">schedule</span><b>Duração:</b> ${escapeHTML(course.duration)}</p>` : ''}${course.period ? `<p><span class="material-icons-outlined" aria-hidden="true">dark_mode</span><b>Período:</b> ${escapeHTML(course.period)}</p>` : ''}<p><span class="material-icons-outlined" aria-hidden="true">school</span><b>Diploma:</b> ${escapeHTML(course.diploma)}</p>${!course.duration ? '<p><small>Veja duração e turno na página do curso.</small></p>' : ''}</div><a class="outline-button" href="${escapeHTML(course.url)}" aria-label="Saiba mais sobre ${escapeHTML(course.name)}">Conheça o curso <span class="material-icons-outlined" aria-hidden="true">arrow_forward</span></a></div></article>`,
        )
        .join('')
    : '<p class="empty">Nenhum curso encontrado. Experimente outra busca ou selecione “Todos”.</p>';
  courseTrack.scrollLeft = 0;
  updateRails();
}
document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderCourses();
  }),
);
courseSearch.addEventListener('input', renderCourses);
function updateRails() {
  document.querySelectorAll('[data-rail]').forEach((button) => {
    const track = document.getElementById(button.dataset.rail);
    button.style.visibility = track.scrollWidth <= track.clientWidth + 2 ? 'hidden' : 'visible';
  });
}
document.querySelectorAll('[data-rail]').forEach((button) =>
  button.addEventListener('click', () => {
    const track = document.getElementById(button.dataset.rail);
    const first = track.firstElementChild;
    const step = first
      ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap)
      : track.clientWidth;
    track.scrollBy({
      left: step * Number(button.dataset.direction),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }),
);
window.addEventListener('resize', updateRails);
let bannerIndex = 0;
const bannerSlides = [...document.querySelectorAll('[data-banner]')];
function showBanner(index) {
  bannerIndex = (index + bannerSlides.length) % bannerSlides.length;
  bannerSlides.forEach((slide, i) => {
    slide.hidden = i !== bannerIndex;
    slide.classList.toggle('active', i === bannerIndex);
  });
  document.dispatchEvent(new CustomEvent('ucp:banner', { detail: { index: bannerIndex } }));
  document
    .querySelectorAll('[data-banner-index]')
    .forEach((button, i) => button.setAttribute('aria-pressed', String(i === bannerIndex)));
}
document
  .querySelectorAll('[data-banner-direction]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      showBanner(bannerIndex + Number(button.dataset.bannerDirection)),
    ),
  );
document
  .querySelectorAll('[data-banner-index]')
  .forEach((button) =>
    button.addEventListener('click', () => showBanner(Number(button.dataset.bannerIndex))),
  );
const banner = document.querySelector('.banner');
const autoplayButton = banner.querySelector('[data-banner-autoplay]');
const reducedBannerMotion = matchMedia('(prefers-reduced-motion: reduce)');
let bannerPaused = reducedBannerMotion.matches;
let bannerTimer;
let bannerHovered = false;
function scheduleBanner() {
  clearTimeout(bannerTimer);
  if (
    bannerPaused ||
    bannerHovered ||
    document.hidden ||
    banner.contains(document.activeElement) ||
    bannerSlides.length < 2
  )
    return;
  bannerTimer = setTimeout(() => {
    showBanner(bannerIndex + 1);
    scheduleBanner();
  }, 6000);
}
function updateAutoplayButton() {
  if (!autoplayButton) return;
  autoplayButton.setAttribute(
    'aria-label',
    bannerPaused
      ? 'Ativar troca automática dos destaques'
      : 'Pausar troca automática dos destaques',
  );
  autoplayButton.innerHTML =
    '<span class="material-icons-outlined" aria-hidden="true">' +
    (bannerPaused ? 'play_arrow' : 'pause') +
    '</span>';
}
autoplayButton?.addEventListener('click', () => {
  bannerPaused = !bannerPaused;
  updateAutoplayButton();
  scheduleBanner();
});
banner.addEventListener('mouseenter', () => {
  bannerHovered = true;
  scheduleBanner();
});
banner.addEventListener('mouseleave', () => {
  bannerHovered = false;
  scheduleBanner();
});
banner.addEventListener('focusin', scheduleBanner);
banner.addEventListener('focusout', () => setTimeout(scheduleBanner, 0));
banner
  .querySelectorAll('[data-banner-direction],[data-banner-index]')
  .forEach((button) => button.addEventListener('click', scheduleBanner));
document.addEventListener('visibilitychange', scheduleBanner);
reducedBannerMotion.addEventListener('change', (event) => {
  bannerPaused = event.matches;
  updateAutoplayButton();
  scheduleBanner();
});
updateAutoplayButton();
scheduleBanner();
let photoIndex = 0;
const photos = window.ucpPhotos;
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const [src, caption] = photos[photoIndex];
  const img = document.querySelector('#gallery-main');
  img.src = src;
  img.alt = caption;
  document.querySelector('#gallery-caption').textContent = caption;
  document
    .querySelectorAll('[data-photo]')
    .forEach((button, i) => button.setAttribute('aria-pressed', String(i === photoIndex)));
}
document
  .querySelectorAll('[data-photo]')
  .forEach((button) =>
    button.addEventListener('click', () => showPhoto(Number(button.dataset.photo))),
  );
document
  .querySelectorAll('[data-gallery-direction]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      showPhoto(photoIndex + Number(button.dataset.galleryDirection)),
    ),
  );
const mediaDialog = document.querySelector('#media-dialog');
const mediaContent = document.querySelector('#media-content');
document.querySelectorAll('[data-video]').forEach((button) =>
  button.addEventListener('click', () => {
    mediaContent.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${button.dataset.video}?autoplay=1" title="Vídeo institucional da UCP" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe><p><a href="https://www.youtube.com/watch?v=${button.dataset.video}" target="_blank" rel="noopener">Abrir vídeo no YouTube ↗</a></p>`;
    mediaDialog.showModal();
  }),
);
document.querySelector('.gallery-zoom').addEventListener('click', () => {
  const [src, caption] = photos[photoIndex];
  mediaContent.innerHTML = `<img src="${src}" alt="${caption}"><p>${caption}</p>`;
  mediaDialog.showModal();
});
mediaDialog.addEventListener('close', () => mediaContent.replaceChildren());
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
});
document
  .querySelector('[data-privacy]')
  ?.addEventListener('click', () => document.querySelector('#privacy-dialog').showModal());
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  nav.classList.remove('mobile-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  menuButton.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">menu</span>';
}
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('mobile-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menuButton.innerHTML =
    '<span class="material-icons-outlined" aria-hidden="true">' +
    (open ? 'close' : 'menu') +
    '</span>';
});
document.querySelectorAll('.nav-toggle').forEach((button) =>
  button.addEventListener('click', () => {
    const group = button.closest('.nav-group');
    const next = !group.classList.contains('open');
    document.querySelectorAll('.nav-group').forEach((item) => {
      item.classList.remove('open');
      item.querySelector('button').setAttribute('aria-expanded', 'false');
    });
    group.classList.toggle('open', next);
    button.setAttribute('aria-expanded', String(next));
  }),
);
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    document.querySelectorAll('.nav-group').forEach((item) => {
      item.classList.remove('open');
      item.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  }
});

renderCourses();
window.addEventListener('load', updateRails);
document
  .querySelector('[data-login]')
  .addEventListener('click', () => document.querySelector('#login-dialog').showModal());

const instagramFeed = document.querySelector('#instagram-feed');
const instagramStatus = document.querySelector('#instagram-status');
let instagramLoading = false;
async function updateInstagram() {
  if (instagramFeed?.dataset.mode !== 'auto' || instagramLoading || document.hidden) return;
  instagramLoading = true;
  instagramFeed.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/instagram', {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Feed indisponível');
    const feed = await response.json();
    if (!Array.isArray(feed.posts)) throw new Error('Resposta inválida');
    const cards = feed.posts.slice(0, 5).map((post) => {
      const link = document.createElement('a');
      link.className = 'social-tile';
      link.href = post.permalink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute(
        'aria-label',
        post.caption
          ? post.caption.slice(0, 180) + ' — abrir no Instagram'
          : 'Abrir publicação da UCP no Instagram',
      );
      if (post.image) {
        const image = document.createElement('img');
        image.src = post.image;
        image.alt = post.caption.slice(0, 180) || 'Publicação da UCP';
        image.loading = 'lazy';
        image.addEventListener(
          'error',
          () => {
            image.remove();
            link.classList.add('instagram-text-post');
          },
          { once: true },
        );
        link.append(image);
      } else link.classList.add('instagram-text-post');
      const label = document.createElement('span');
      label.className = 'instagram-post-type';
      label.textContent =
        post.type === 'VIDEO'
          ? '▶ Reel'
          : post.type === 'CAROUSEL_ALBUM'
            ? '▣ Carrossel'
            : '◎ Instagram';
      link.append(label);
      const caption = document.createElement('strong');
      caption.className = 'instagram-caption';
      caption.textContent = post.caption.slice(0, 120) || 'Veja esta publicação no Instagram';
      link.append(caption);
      return link;
    });
    instagramFeed.replaceChildren(...cards);
    instagramStatus.textContent =
      feed.status === 'stale'
        ? 'A atualização está temporariamente indisponível. Exibindo as últimas publicações recebidas.'
        : feed.posts.length
          ? ''
          : 'As publicações estão disponíveis no perfil oficial da UCP. Acesse pelo botão abaixo.';
  } catch {
    instagramStatus.textContent = instagramFeed.children.length
      ? 'Não foi possível atualizar agora. Exibindo as últimas publicações recebidas.'
      : 'Não foi possível carregar as publicações agora. Acompanhe o perfil oficial da UCP pelo botão abaixo.';
  } finally {
    instagramFeed.setAttribute('aria-busy', 'false');
    instagramLoading = false;
  }
}
updateInstagram();
setInterval(updateInstagram, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateInstagram();
});
