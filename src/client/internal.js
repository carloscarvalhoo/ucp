document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
});
document
  .querySelector('[data-login]')
  ?.addEventListener('click', () => document.querySelector('#login-dialog').showModal());
document
  .querySelector('[data-privacy]')
  ?.addEventListener('click', () => document.querySelector('#privacy-dialog').showModal());
document.querySelectorAll('.nav-toggle').forEach((button) =>
  button.addEventListener('click', () => {
    const group = button.closest('.nav-group'),
      open = !group.classList.contains('open');
    document.querySelectorAll('.nav-group').forEach((g) => {
      g.classList.remove('open');
      g.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
    });
    group.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
  }),
);
const menu = document.querySelector('.menu-toggle'),
  nav = document.querySelector('#main-nav');
menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('mobile-open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.innerHTML =
    '<span class="material-icons-outlined" aria-hidden="true">' +
    (open ? 'close' : 'menu') +
    '</span>';
});

const tabs = [...document.querySelectorAll('.course-tabs [role=tab]')];
function activateTab(tab) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowDown') next = (i + 1) % tabs.length;
    if (event.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      activateTab(tabs[next]);
      tabs[next].focus();
    }
  });
});
document.querySelector('[data-directory-search]')?.addEventListener('input', (event) => {
  const normalize = (s) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  let visible = 0;
  document.querySelectorAll('[data-directory-card]').forEach((card) => {
    card.hidden = !normalize(card.textContent).includes(normalize(event.target.value));
    if (!card.hidden) visible++;
  });
  document.querySelector('.directory-empty').hidden = visible > 0;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    nav.classList.remove('mobile-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">menu</span>';
    document.querySelectorAll('.nav-group').forEach((g) => g.classList.remove('open'));
  }
});

document.querySelectorAll('.teacher-carousel').forEach((carousel) => {
  const track = carousel.querySelector('.teacher-carousel-track'),
    buttons = [...carousel.querySelectorAll('[data-teacher-direction]')];
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    buttons.forEach((b) => {
      b.disabled =
        max < 2 ||
        (Number(b.dataset.teacherDirection) < 0
          ? track.scrollLeft < 2
          : track.scrollLeft >= max - 2);
    });
  };
  const move = (direction) => {
    const card = track.querySelector('article');
    if (!card) return;
    const step =
      card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || '0');
    const count = Math.max(1, Math.round(track.clientWidth / step));
    track.scrollBy({
      left: direction * step * count,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };
  buttons.forEach((b) =>
    b.addEventListener('click', () => move(Number(b.dataset.teacherDirection))),
  );
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
  new ResizeObserver(update).observe(track);
  update();
});
