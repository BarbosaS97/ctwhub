// Header: fundo sólido ao rolar
const header = document.getElementById('header');
const onScroll = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 20);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Logo: grande e em destaque no hero, some suavemente dando lugar à
// logo pequena do menu conforme a página é rolada.
const heroLogo = document.getElementById('heroLogo');
const navLogoImg = document.querySelector('#navLogo img');

if (heroLogo && navLogoImg) {
  const THRESHOLD = 200; // px de rolagem até a troca terminar
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const updateLogos = () => {
    const p = easeOutCubic(Math.min(window.scrollY / THRESHOLD, 1));
    heroLogo.style.opacity = 1 - p;
    heroLogo.style.transform = `translateY(${p * -18}px) scale(${1 - p * 0.06})`;
    navLogoImg.style.opacity = p;
  };
  updateLogos();

  let ticking2 = false;
  window.addEventListener('scroll', () => {
    if (!ticking2) {
      window.requestAnimationFrame(() => {
        updateLogos();
        ticking2 = false;
      });
      ticking2 = true;
    }
  }, { passive: true });
}

// Vídeo voador: viaja do Hero para os Pilares (e volta) conforme a rolagem
const heroSlot = document.getElementById('heroSlot');
const pillarsSlot = document.getElementById('pillarsSlot');
const flyingCard = document.getElementById('flyingCard');

if (heroSlot && pillarsSlot && flyingCard) {
  let flightParent = 'hero'; // 'hero' | 'pillars' | 'fixed'
  let zoneStart = 0;
  let zoneEnd = 1;

  const setStatic = (targetSlot, key) => {
    if (flightParent === key) return;
    targetSlot.appendChild(flyingCard);
    flyingCard.classList.remove('is-flying');
    flyingCard.style.transform = '';
    flyingCard.style.width = '';
    flyingCard.style.height = '';
    flightParent = key;
  };

  const updateFlight = () => {
    let progress = (window.scrollY - zoneStart) / (zoneEnd - zoneStart);
    progress = Math.min(1, Math.max(0, progress));

    if (progress <= 0) { setStatic(heroSlot, 'hero'); return; }
    if (progress >= 1) { setStatic(pillarsSlot, 'pillars'); return; }

    if (flightParent !== 'fixed') {
      // Sobe pro <body> enquanto voa: assim ele deixa de pertencer à pilha
      // de camadas da seção de origem e sempre renderiza por cima de tudo,
      // sem risco de ficar atrás de texto/ícones no meio do trajeto.
      document.body.appendChild(flyingCard);
      flyingCard.classList.add('is-flying');
      flightParent = 'fixed';
    }

    const hRect = heroSlot.getBoundingClientRect();
    const pRect = pillarsSlot.getBoundingClientRect();
    const width = hRect.width + (pRect.width - hRect.width) * progress;
    const height = hRect.height + (pRect.height - hRect.height) * progress;
    const x = hRect.left + (pRect.left - hRect.left) * progress;
    const y = hRect.top + (pRect.top - hRect.top) * progress;

    flyingCard.style.width = `${width}px`;
    flyingCard.style.height = `${height}px`;
    flyingCard.style.transform = `translate(${x}px, ${y}px)`;
  };

  const measureFlightZone = () => {
    // Usa a posição absoluta das duas vagas (independe do scroll atual) para
    // que a largura da zona de voo acompanhe a distância real entre elas —
    // no mobile, com tudo empilhado, essa distância é bem maior que no
    // desktop, e uma zona fixa curta fazia o card "pular" em vez de voar.
    const hRect = heroSlot.getBoundingClientRect();
    const heroDocY = hRect.top + window.scrollY;
    const pRect = pillarsSlot.getBoundingClientRect();
    const pillarsDocY = pRect.top + window.scrollY;

    zoneStart = heroDocY - window.innerHeight * 0.15;
    zoneEnd = pillarsDocY - window.innerHeight * 0.55;
    if (zoneStart < 0) zoneStart = 0;
    if (zoneEnd <= zoneStart + 80) zoneEnd = zoneStart + 80;
    updateFlight();
  };

  let tickingFlight = false;
  window.addEventListener('scroll', () => {
    if (!tickingFlight) {
      window.requestAnimationFrame(() => {
        updateFlight();
        tickingFlight = false;
      });
      tickingFlight = true;
    }
  }, { passive: true });
  window.addEventListener('resize', measureFlightZone);
  window.addEventListener('load', measureFlightZone);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureFlightZone);
  }
  measureFlightZone();
}

// Carrossel "Siga a W-HUB": item ativo centralizado e maior, loop infinito
const feedTrack = document.getElementById('feedTrack');
const feedPrev = document.getElementById('feedPrev');
const feedNext = document.getElementById('feedNext');

if (feedTrack && feedPrev && feedNext) {
  const feedViewport = feedTrack.parentElement;
  const realSlides = Array.from(feedTrack.children);
  const REAL_COUNT = realSlides.length;
  const CLONE_COUNT = 3; // cobre o maior número de itens visíveis (desktop)
  const GAP = 20;
  const TRANSITION_MS = 550;

  // Clona as pontas para permitir rolagem infinita nos dois sentidos
  realSlides.slice(-CLONE_COUNT).reverse().forEach((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    feedTrack.insertBefore(clone, feedTrack.firstChild);
  });
  realSlides.slice(0, CLONE_COUNT).forEach((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    feedTrack.appendChild(clone);
  });

  const allSlides = Array.from(feedTrack.children);
  let activeIndex = CLONE_COUNT + Math.floor(REAL_COUNT / 2);
  let slideWidth = 0;

  const visibleCount = () => {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  };

  const updateFeed = () => {
    allSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === activeIndex));

    const vpWidth = feedViewport.clientWidth;
    const step = slideWidth + GAP;
    const desired = activeIndex * step + slideWidth / 2 - vpWidth / 2;
    feedTrack.style.transform = `translateX(${-desired}px)`;
  };

  const jumpWithoutTransition = () => {
    feedTrack.style.transition = 'none';
    updateFeed();
    void feedTrack.offsetHeight; // força reflow antes de reativar a transição
    feedTrack.style.transition = '';
  };

  const scheduleWrapCheck = () => {
    window.setTimeout(() => {
      if (activeIndex >= CLONE_COUNT + REAL_COUNT) {
        activeIndex -= REAL_COUNT;
        jumpWithoutTransition();
      } else if (activeIndex < CLONE_COUNT) {
        activeIndex += REAL_COUNT;
        jumpWithoutTransition();
      }
    }, TRANSITION_MS);
  };

  const layoutFeed = () => {
    const count = visibleCount();
    const vpWidth = feedViewport.clientWidth;
    slideWidth = (vpWidth - GAP * (count - 1)) / count;
    allSlides.forEach((slide) => { slide.style.width = `${slideWidth}px`; });
    updateFeed();
  };

  feedPrev.addEventListener('click', () => {
    activeIndex--;
    updateFeed();
    scheduleWrapCheck();
  });
  feedNext.addEventListener('click', () => {
    activeIndex++;
    updateFeed();
    scheduleWrapCheck();
  });
  window.addEventListener('resize', layoutFeed);
  window.addEventListener('load', layoutFeed);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutFeed);
  }
  layoutFeed();
}

// Menu mobile
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('.nav__link').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
);
revealEls.forEach((el) => revealObserver.observe(el));
