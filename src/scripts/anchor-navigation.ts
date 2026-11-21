export function trackAnchorNavigation(nav: HTMLElement | null, onScroll?: () => void) {
  const anchors = [...(nav?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [])]
    .map((link) => ({ link, target: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
    .reverse();
  let current: HTMLAnchorElement | undefined;
  let frame = 0;

  function update() {
    frame = 0;
    const readingLine = Math.min(146, window.innerHeight / 4);
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const visible = anchors.find(({ target }) =>
      target && target.getBoundingClientRect().top <= (atBottom ? window.innerHeight - 1 : readingLine));

    if (visible?.link !== current) {
      current?.removeAttribute('aria-current');
      current = visible?.link;
      current?.setAttribute('aria-current', 'location');
    }

    onScroll?.();
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate, { once: true });
  window.addEventListener('pageshow', scheduleUpdate);
  update();
}
