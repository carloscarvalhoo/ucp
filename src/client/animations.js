(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.65 });
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const seen = new WeakSet(),
      hovered = new WeakSet(),
      listeners = [],
      observers = [];
    const on = (el, event, fn) => {
      el.addEventListener(event, fn);
      listeners.push([el, event, fn]);
    };
    function register() {
      [
        ...document.querySelectorAll(
          '.section-title,.institutional-video>div,.quick-card,.course-card,.stats>div,.project-card,.community-card,.social-tile,.directory-grid>a,.contact-panel,.service-note,.course-panels>section',
        ),
      ].forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        ScrollTrigger.create({
          trigger: el,
          start: 'top 93%',
          once: true,
          onEnter: () =>
            gsap.fromTo(
              el,
              { autoAlpha: 0.2, y: 10 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.65,
                delay: (i % 4) * 0.045,
                clearProps: 'transform,opacity,visibility',
              },
            ),
        });
      });
      if (matchMedia('(hover:hover) and (pointer:fine)').matches)
        document
          .querySelectorAll(
            '.course-card,.community-card,.project-card,.quick-card,.solid-button,.outline-button',
          )
          .forEach((el) => {
            if (hovered.has(el)) return;
            hovered.add(el);
            on(el, 'mouseenter', () => gsap.to(el, { y: -2, duration: 0.3, overwrite: 'auto' }));
            on(el, 'mouseleave', () =>
              gsap.to(el, { y: 0, duration: 0.4, overwrite: 'auto', clearProps: 'transform' }),
            );
          });
    }
    gsap.from('.page-heading h1,.course-hero h1', {
      y: 12,
      autoAlpha: 0.3,
      duration: 0.85,
      clearProps: 'transform,opacity,visibility',
    });
    document.querySelectorAll('.gallery-stage,.course-hero-grid').forEach((container) => {
      const img = container.querySelector('img');
      if (img)
        gsap.fromTo(
          img,
          { yPercent: 0 },
          {
            yPercent: -1.5,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.6,
            },
          },
        );
    });
    on(document, 'ucp:banner', (e) => {
      const slide = document.querySelectorAll('[data-banner]')[e.detail.index];
      if (!slide) return;
      gsap.fromTo(slide, { opacity: 0.7 }, { opacity: 1, duration: 0.8, clearProps: 'opacity' });
      const copy = slide.querySelectorAll('.banner-copy>*');
      gsap.killTweensOf(copy);
      if (copy.length)
        gsap.fromTo(
          copy,
          { y: 12, opacity: 0.3 },
          { y: 0, opacity: 1, stagger: 0.055, duration: 0.8, clearProps: 'transform,opacity' },
        );
    });
    const gallery = document.querySelector('#gallery-main');
    if (gallery) {
      const o = new MutationObserver(() =>
        gsap.fromTo(
          gallery,
          { opacity: 0.65 },
          { opacity: 1, duration: 0.6, clearProps: 'opacity' },
        ),
      );
      o.observe(gallery, { attributes: true, attributeFilter: ['src'] });
      observers.push(o);
    }
    for (const selector of ['#course-track', '#instagram-feed', '.course-panels']) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const observer = new MutationObserver(() => {
        register();
        ScrollTrigger.refresh();
      });
      observer.observe(
        el,
        selector === '.course-panels'
          ? { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }
          : { childList: true },
      );
      observers.push(observer);
    }
    register();
    const refresh = () => ScrollTrigger.refresh();
    on(window, 'load', refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      listeners.forEach(([el, event, fn]) => el.removeEventListener(event, fn));
      observers.forEach((o) => o.disconnect());
    };
  });
})();
