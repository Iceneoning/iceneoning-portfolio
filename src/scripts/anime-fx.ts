/**
 * Site-wide anime flavour: scroll reveal, pointer tilt, hero typewriter, snowfall,
 * click sparkles and the mascot "冰霓". Everything degrades to static content and
 * respects prefers-reduced-motion.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const store = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)] as T;

function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((target) => observer.observe(target));
}

function initTilt() {
  if (!finePointer.matches || reducedMotion.matches) return;
  for (const element of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    const max = Number(element.dataset.tiltMax ?? 6);
    let frame = 0;
    element.addEventListener('pointermove', (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        element.style.setProperty('--mx', x.toFixed(3));
        element.style.setProperty('--my', y.toFixed(3));
        element.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
        element.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
      });
    });
    element.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      for (const name of ['--mx', '--my']) element.style.setProperty(name, '0');
      for (const name of ['--rx', '--ry']) element.style.setProperty(name, '0deg');
    });
  }
}

function initTyper() {
  const typer = document.querySelector<HTMLElement>('[data-typer]');
  if (!typer || reducedMotion.matches) return;
  const words: string[] = JSON.parse(typer.dataset.words ?? '[]');
  if (words.length < 2) return;
  let word = 0;
  let length = words[0]?.length ?? 0;
  let deleting = true;
  const tick = () => {
    const current = words[word] ?? '';
    length += deleting ? -1 : 1;
    typer.textContent = current.slice(0, Math.max(0, length));
    let delay = deleting ? 55 : 120;
    if (!deleting && length >= current.length) { deleting = true; delay = 2100; }
    else if (deleting && length <= 0) { deleting = false; word = (word + 1) % words.length; delay = 320; }
    window.setTimeout(tick, delay);
  };
  window.setTimeout(tick, 2400);
}

function sparkle(x: number, y: number, amount = 7) {
  if (reducedMotion.matches) return;
  const glyphs = ['❄', '✦', '✧', '❅', '♡'];
  const colors = ['#7fb2ff', '#b9a8ff', '#ff9cc9', '#8fdcef'];
  for (let i = 0; i < amount; i++) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.6;
    const distance = 26 + Math.random() * 34;
    particle.className = 'fx-spark';
    particle.textContent = pick(glyphs);
    particle.style.cssText = `left:${x}px;top:${y}px;color:${pick(colors)};--tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;font-size:${10 + Math.random() * 8}px`;
    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

function initClickSparkles() {
  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, .demo-video, [data-showcase-viewport]')) return;
    sparkle(event.clientX, event.clientY, 6);
  });
}

function initSnow() {
  const layer = document.querySelector<HTMLElement>('[data-snow]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-fx-snow]');
  if (!layer) return;
  const saved = store.get('ice-fx-snow');
  let enabled = saved ? saved === 'on' : !reducedMotion.matches;
  const build = () => {
    if (layer.childElementCount) return;
    const count = window.innerWidth < 700 ? 16 : 30;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('i');
      const size = 3 + Math.random() * 6;
      flake.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;--dur:${9 + Math.random() * 12}s;--delay:${-Math.random() * 20}s;--drift:${(Math.random() - 0.5) * 120}px;opacity:${0.35 + Math.random() * 0.5}`;
      fragment.appendChild(flake);
    }
    layer.appendChild(fragment);
  };
  const apply = () => {
    if (enabled) build();
    layer.classList.toggle('is-on', enabled);
    toggle?.setAttribute('aria-pressed', String(enabled));
  };
  toggle?.addEventListener('click', () => {
    enabled = !enabled;
    store.set('ice-fx-snow', enabled ? 'on' : 'off');
    apply();
    say(enabled ? '下雪啦～冬天就是要有雪才对嘛 ❄' : '雪停了，现在看作品更清楚了吧？');
  });
  apply();
}

/* ---------------- Mascot ---------------- */
let bubble: HTMLElement | null = null;
let bubbleTimer = 0;
let mascotVisible = true;

function say(text: string, duration = 4800) {
  if (!bubble || !mascotVisible) return;
  bubble.textContent = text;
  bubble.hidden = false;
  bubble.classList.remove('is-pop');
  void bubble.offsetWidth;
  bubble.classList.add('is-pop');
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => { if (bubble) bubble.hidden = true; }, duration);
}

const pokeLines = [
  '戳我干嘛啦～快去看作品！',
  '冰霓是这个作品集的看板娘，请多指教 (｡•ω•｡)/',
  '偷偷告诉你：游戏放映厅可以用滚轮和方向键换片哦。',
  '点右上角的 ❄ 可以开关飘雪～',
  '每个作品卡片都可以点进去看技术细节！',
  '图形学、前端、后端……都是很好玩的东西呢。',
  '如果喜欢的话，也去博客看看吧 ✧',
  '再戳的话……冰霓要结冰了！❄',
];
const sectionLines: Record<string, string> = {
  sections: '想先逛哪个展区？点卡片就能直达～',
  games: '这里是游戏放映厅！拖一拖、滚一滚就能换片。',
  graphics: '图形学与渲染区～光线、着色器和角色材质都在这里。',
  frontend: '前端区！动效和交互是冰霓最喜欢的部分 ♪',
  backend: '后端区：服务端和 Mod 开发，看起来朴素但很重要哦。',
  misc: '杂项区里放着各种小实验，偶尔会有惊喜～',
  about: '最后是关于页！感谢你看到这里 (≧∇≦)/',
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '这么晚还在看作品吗？要注意休息哦 ☾';
  if (hour < 11) return '早上好！欢迎来到冰霓的创作档案 ☀';
  if (hour < 14) return '中午好～吃过饭了吗？顺便看看作品吧！';
  if (hour < 18) return '下午好！来杯热可可，慢慢逛 ☕';
  return '晚上好～今晚也一起看看作品吧 ✧';
}

function initMascot() {
  const mascot = document.querySelector<HTMLElement>('[data-mascot]');
  const summon = document.querySelector<HTMLButtonElement>('[data-mascot-show]');
  if (!mascot) return;
  bubble = mascot.querySelector('[data-mascot-bubble]');
  const body = mascot.querySelector<HTMLButtonElement>('[data-mascot-poke]');
  const isHome = mascot.dataset.mascotPage === 'home';

  const setVisible = (visible: boolean, announce = true) => {
    mascotVisible = visible;
    mascot.hidden = !visible;
    if (summon) summon.hidden = visible;
    store.set('ice-mascot', visible ? 'shown' : 'hidden');
    if (visible && announce) say('我回来啦！');
  };
  if (store.get('ice-mascot') === 'hidden') setVisible(false, false);
  else if (!store.get('ice-mascot') && window.matchMedia('(max-width: 700px)').matches) {
    // Small screens start with the compact summon tab so the mascot never covers content.
    mascotVisible = false;
    mascot.hidden = true;
    if (summon) summon.hidden = false;
  }

  mascot.querySelector('[data-mascot-hide]')?.addEventListener('click', () => {
    setVisible(false);
    summon?.focus();
  });
  summon?.addEventListener('click', () => {
    setVisible(true);
    body?.focus();
  });
  mascot.querySelector('[data-fx-top]')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    say('咻——回到顶部啦！', 2400);
  });

  let pokes = 0;
  let pokeReset = 0;
  body?.addEventListener('click', (event) => {
    pokes += 1;
    window.clearTimeout(pokeReset);
    pokeReset = window.setTimeout(() => { pokes = 0; }, 2500);
    body.classList.remove('is-hop');
    void body.offsetWidth;
    body.classList.add('is-hop');
    const bounds = body.getBoundingClientRect();
    sparkle(event.clientX || bounds.left + bounds.width / 2, event.clientY || bounds.top + 20, 8);
    say(pokes >= 5 ? '呜……别戳啦，冰霓要融化了 >_<' : pick(pokeLines));
  });

  // Contextual lines for cards and section cards.
  let hoverTimer = 0;
  const onHint = (event: Event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-mascot-say]');
    if (!target) return;
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => say(target.dataset.mascotSay ?? '', 3800), 260);
  };
  document.addEventListener('pointerover', onHint);
  document.addEventListener('focusin', onHint);
  document.addEventListener('pointerout', (event) => {
    if ((event.target as HTMLElement).closest('[data-mascot-say]')) window.clearTimeout(hoverTimer);
  });

  if (isHome && 'IntersectionObserver' in window) {
    const seen = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (!entry.isIntersecting || seen.has(id)) continue;
        seen.add(id);
        if (sectionLines[id]) say(sectionLines[id]);
      }
    }, { threshold: 0.35 });
    Object.keys(sectionLines).forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  } else if (!isHome) {
    const end = document.getElementById('project-navigation');
    if (end && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        say('看完啦？可以从这里去上一部 / 下一部作品哦～');
        observer.disconnect();
      }, { threshold: 0.4 });
      observer.observe(end);
    }
  }

  const title = document.title.split(' · ')[0]?.trim();
  window.setTimeout(() => {
    if (isHome) say(greeting(), 5200);
    else if (document.querySelector('.not-found')) say('哎呀，这里好像迷路了……点按钮回作品集吧！', 6000);
    else if (title) say(`这是「${title}」的案例页，左侧目录可以快速跳转章节～`, 5600);
  }, 1300);
}

function initHeroBubble() {
  const button = document.querySelector<HTMLButtonElement>('[data-hero-bubble]');
  const line = button?.querySelector<HTMLElement>('[data-hero-line]');
  if (!button || !line) return;
  const lines = [
    '欢迎光临！右下角的冰霓会带你参观这个作品集 ✧',
    '这里有游戏、渲染、前端和后端的作品哦。',
    '往下滑就是游戏放映厅，记得试试拖拽换片！',
    '右下角的 Q 版冰霓也可以戳一戳～',
    '喜欢的话，欢迎去博客看看开发笔记 ☕',
  ];
  let index = -1;
  button.addEventListener('click', (event) => {
    index = (index + 1) % lines.length;
    line.textContent = lines[index] ?? '';
    button.classList.remove('is-pop');
    void button.offsetWidth;
    button.classList.add('is-pop');
    const bounds = button.getBoundingClientRect();
    sparkle(event.clientX || bounds.left + bounds.width / 2, event.clientY || bounds.top + bounds.height / 2, 8);
  });
}

export function initAnimeFx() {
  initReveal();
  initTilt();
  initTyper();
  initSnow();
  initClickSparkles();
  initMascot();
  initHeroBubble();
}
