(() => {
  document.querySelectorAll('[data-benefits]').forEach((section) => {
    const track = section.querySelector('.benefit-track');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let timer,
      paused = reduced.matches,
      hovered = false;
    const schedule = () => {
      clearTimeout(timer);
      if (paused || hovered || document.hidden || section.contains(document.activeElement)) return;
      timer = setTimeout(() => {
        move(1);
        schedule();
      }, 7000);
    };
    const move = (direction) => {
      const card = track.firstElementChild;
      if (!card || track.scrollWidth <= track.clientWidth) return;
      const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
      const max = track.scrollWidth - track.clientWidth;
      let target = track.scrollLeft + step * direction;
      if (target > max + 3) target = 0;
      if (target < -3) target = max;
      if (window.gsap && !reduced.matches) {
        gsap.killTweensOf(track);
        track.style.scrollSnapType = 'none';
        gsap.to(track, {
          scrollLeft: Math.max(0, Math.min(target, max)),
          duration: 0.85,
          ease: 'power2.inOut',
          onComplete: () => track.style.removeProperty('scroll-snap-type'),
        });
      } else track.scrollLeft = Math.max(0, Math.min(target, max));
    };
    section.querySelectorAll('[data-benefit-direction]').forEach((arrow) =>
      arrow.addEventListener('click', () => {
        move(Number(arrow.dataset.benefitDirection));
        schedule();
      }),
    );
    section.addEventListener('mouseenter', () => {
      hovered = true;
      schedule();
    });
    section.addEventListener('mouseleave', () => {
      hovered = false;
      schedule();
    });
    section.addEventListener('focusin', schedule);
    section.addEventListener('focusout', () => setTimeout(schedule, 0));
    track.addEventListener('pointerdown', () => {
      window.gsap?.killTweensOf(track);
      track.style.removeProperty('scroll-snap-type');
    });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', () => {
      paused = reduced.matches;
      schedule();
    });
    schedule();
  });
})();
