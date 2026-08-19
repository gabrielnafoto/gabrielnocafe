// public/site-client.js — hydration + interactivity for the zine.
//
// The server already rendered the whole publication (see api/index.js), so this
// script only adds behaviour: language switching, the contents overlay, the
// running folio, copy-link, photo carousels, and the drawn-ink motion.
//
// Deliberately NOT here any more:
//   * the chapter accordion — every chapter's items ship open in the HTML, so
//     there's nothing to toggle, nothing to reflow, and nothing hidden from a
//     reader (or a crawler) behind a click.
//   * the .rise entrance observer — it held content at opacity:0 with a 14px
//     translate until it scrolled into view, which is what produced the page's
//     layout shift. Content is simply present now.
(function () {
  const DATA = window.__SITE_DATA__ || {};
  const SERVER_LANG = window.__SITE_LANG__ || "pt";
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");

  let lang = SERVER_LANG;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Every hand-drawn mark that draws itself in when it first scrolls into view.
  const INK = ".cover-circle, .chapter-underline, .mini-rule";

  /* ------------------------------------------------------------------ */
  /* language                                                           */
  /* ------------------------------------------------------------------ */

  function detectLang() {
    const stored = localStorage.getItem("lang");
    if (stored === "pt" || stored === "en") return stored;
    const nav = (navigator.language || "pt").toLowerCase();
    return nav.startsWith("pt") ? "pt" : "en";
  }

  function setLang(next, persist) {
    // Clicking the language you're already reading shouldn't rebuild the page.
    if (persist && next === lang) return;

    lang = next;
    if (persist) localStorage.setItem("lang", next);
    document.documentElement.lang = next === "en" ? "en" : "pt-BR";

    // Only re-render when the language actually differs from what the server
    // painted — otherwise we'd throw away perfectly good server markup.
    if (next !== SERVER_LANG || persist) {
      keepingScrollPlace(() => {
        app.innerHTML = window.SiteRender.renderApp(DATA, next);
        // paintMasthead reads the outgoing bar's folio state, so it has to run
        // while that element is still in the document.
        paintMasthead(next);
        wirePage();
      });
    }

    document.getElementById("btn-pt")?.classList.toggle("active", next === "pt");
    document.getElementById("btn-en")?.classList.toggle("active", next === "en");
    const skip = document.getElementById("skip-link");
    if (skip) skip.textContent = window.SiteRender.t(next, "skipToContent");
  }

  // Rebuilding #app drops the reader wherever the new document height happens
  // to put them — switching language halfway down the page used to teleport
  // you. Pin the chapter you were reading to the same spot on screen instead;
  // fall back to the raw offset when no chapter is in view (cover, back cover).
  // scroll-behavior is forced to auto for the restore, or the smooth-scroll on
  // html would animate the correction as a visible jump.
  function keepingScrollPlace(mutate) {
    const anchor = document.querySelector(".masthead")?.dataset.currentAnchor;
    const offsetBefore = anchor
      ? document.getElementById(anchor)?.getBoundingClientRect().top
      : null;
    const yBefore = window.scrollY;

    mutate();

    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const target = anchor && offsetBefore != null ? document.getElementById(anchor) : null;
    if (target) {
      window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - offsetBefore);
    } else {
      window.scrollTo(0, yBefore);
    }

    html.style.scrollBehavior = previous;
  }

  // The masthead is replaced wholesale from the same render function the server
  // used — one definition of that bar, no patching of individual labels. It
  // holds five pieces of translatable copy (wordmark, chapter list, edition
  // line, "contents", the nav's accessible name) and used to stay in
  // Portuguese forever, since api/index.js built it outside the module.
  //
  // The folio's "you are here" state is carried across: without it, switching
  // language mid-scroll flashes the wordmark back in on mobile (where the
  // folio replaces the brand) and drops the nav's current-chapter marker until
  // the next scroll event.
  function paintMasthead(next) {
    const old = document.getElementById("masthead");
    if (!old) return;

    const anchor = old.dataset.currentAnchor;
    const palette = old.dataset.palette;

    const tpl = document.createElement("template");
    tpl.innerHTML = window.SiteRender.renderMasthead(DATA, next).trim();
    const fresh = tpl.content.firstElementChild;
    if (!fresh) return;

    if (anchor) fresh.dataset.currentAnchor = anchor;
    if (palette) fresh.dataset.palette = palette;
    old.replaceWith(fresh);

    if (!anchor) return;
    // #app was re-rendered just above, so the section already carries its
    // title in the new language — read it back rather than waiting for a
    // scroll to correct the folio.
    const section = document.getElementById(anchor);
    if (section?.dataset.chapter) setFolio(section);
    document.querySelectorAll("[data-nav-link]").forEach((a) => {
      a.classList.toggle("current", a.dataset.anchor === anchor);
    });
  }

  // Chapter titles are admin-authored, so the folio is built with textContent
  // rather than an innerHTML template.
  function setFolio(section) {
    const folio = document.getElementById("folio");
    if (!folio) return;
    const n = document.createElement("span");
    n.className = "n";
    n.textContent = section.dataset.chapter || "";
    folio.textContent = "";
    folio.append(n, ` ${section.dataset.chapterTitle || ""}`);
  }

  /* ------------------------------------------------------------------ */
  /* contents overlay                                                   */
  /* ------------------------------------------------------------------ */

  let lastFocus = null;

  function overlay() { return document.getElementById("index-overlay"); }

  function openIndex() {
    const ov = overlay();
    if (!ov) return;
    lastFocus = document.activeElement;
    markCurrentInIndex();
    ov.classList.add("open");
    document.body.classList.add("index-open");
    document.getElementById("index-btn")?.setAttribute("aria-expanded", "true");
    ov.querySelector(".index-close")?.focus();
  }

  function closeIndex() {
    const ov = overlay();
    if (!ov) return;
    ov.classList.remove("open");
    document.body.classList.remove("index-open");
    document.getElementById("index-btn")?.setAttribute("aria-expanded", "false");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // Highlight the chapter the reader is currently in, so the contents page
  // doubles as a "you are here" marker.
  function markCurrentInIndex() {
    const current = document.querySelector(".masthead")?.dataset.currentAnchor;
    document.querySelectorAll("[data-index-link]").forEach((a) => {
      a.classList.toggle("current", !!current && a.dataset.anchor === current);
    });
  }

  // All masthead controls are delegated from document, never bound to the
  // nodes themselves: paintMasthead() replaces that whole subtree on a
  // language switch, which would silently kill any direct listener.
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btn-pt")) { setLang("pt", true); return; }
    if (e.target.closest("#btn-en")) { setLang("en", true); return; }
    if (e.target.closest("#index-btn")) { openIndex(); return; }
    if (e.target.closest("#index-close")) { closeIndex(); return; }
    const link = e.target.closest("[data-index-link]");
    if (link) closeIndex(); // let the browser handle the anchor jump
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (overlay()?.classList.contains("open")) closeIndex();
  });

  // Keep focus inside the overlay while it's open.
  document.addEventListener("keydown", (e) => {
    const ov = overlay();
    if (e.key !== "Tab" || !ov || !ov.classList.contains("open")) return;
    const focusables = ov.querySelectorAll("a[href], button:not([disabled])");
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ------------------------------------------------------------------ */
  /* click tracking, copy link, carousels                               */
  /* ------------------------------------------------------------------ */

  app.addEventListener("click", (e) => {
    // Fire-and-forget click count. Links open in a new tab (target="_blank"),
    // so the current page never unloads — a plain fetch is enough, no
    // sendBeacon needed. Never blocks the click or surfaces an error.
    const tracked = e.target.closest("[data-track-id]");
    if (tracked?.dataset.trackId) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tracked.dataset.trackId }),
        keepalive: true,
      }).catch(() => {});
    }

    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      const url = copyBtn.dataset.copy;
      const done = () => {
        toast.textContent = window.SiteRender.t(lang, "copied");
        toast.classList.add("show");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove("show"), 1800);
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => {});
      }
      return;
    }

    const carouselNav = e.target.closest("[data-nav]");
    if (carouselNav) {
      const track = carouselNav.closest("[data-carousel]")?.querySelector("[data-track]");
      if (track) {
        const dir = Number(carouselNav.dataset.nav);
        track.scrollBy({ left: track.clientWidth * dir, behavior: "smooth" });
      }
      return;
    }

    const dot = e.target.closest("[data-goto]");
    if (dot) {
      const track = dot.closest("[data-carousel]")?.querySelector("[data-track]");
      if (track) {
        const i = Number(dot.dataset.goto);
        track.scrollTo({ left: track.clientWidth * i, behavior: "smooth" });
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /* motion: drawn ink + the running folio                              */
  /* ------------------------------------------------------------------ */

  let drawObserver = null;
  let folioObserver = null;

  // The only entrance left is ink drawing itself in — a stroke-dashoffset
  // animation on an SVG path, which cannot move anything around it.
  function wireMotion() {
    drawObserver?.disconnect();

    if (reduceMotion) {
      document.querySelectorAll(INK).forEach((el) => el.classList.add("drawn"));
      return;
    }

    drawObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("drawn");
        drawObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll(INK).forEach((el) => drawObserver.observe(el));
  }

  // The masthead shows which chapter you're reading, like a magazine folio.
  function wireFolio() {
    folioObserver?.disconnect();

    const folio = document.getElementById("folio");
    const masthead = document.querySelector(".masthead");
    if (!folio || !masthead) return;

    const chapters = [...document.querySelectorAll("[data-chapter]")];
    if (!chapters.length) return;

    folioObserver = new IntersectionObserver((entries) => {
      // Pick the chapter closest to the top of the viewport among those visible.
      const visible = entries.filter((e) => e.isIntersecting);
      if (!visible.length) {
        // Nothing crossing the detection band right now doesn't necessarily
        // mean nothing is current — right at a chapter boundary, a chapter can
        // flicker in/out of that band across consecutive frames. Only clear
        // once we're above the very first chapter or below the very last one.
        const firstTop = chapters[0].getBoundingClientRect().top;
        const lastRect = chapters[chapters.length - 1].getBoundingClientRect();
        const aboveAll = firstTop > window.innerHeight * .3;
        const belowAll = lastRect.bottom < 0;
        if (aboveAll || belowAll) {
          delete masthead.dataset.currentAnchor;
          delete masthead.dataset.palette;
        }
        return;
      }
      const top = visible.reduce((a, b) =>
        Math.abs(a.boundingClientRect.top) < Math.abs(b.boundingClientRect.top) ? a : b);
      const el = top.target;
      setFolio(el);
      masthead.dataset.currentAnchor = el.id;
      // Tint the sticky header with the current chapter's own palette.
      masthead.dataset.palette = el.dataset.palette || "";
      // The desktop nav and the (possibly open) contents overlay both double
      // as "you are here" markers — keep them live as the reader scrolls.
      document.querySelectorAll("[data-nav-link]").forEach((a) => {
        a.classList.toggle("current", a.dataset.anchor === el.id);
      });
      markCurrentInIndex();
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });

    chapters.forEach((c) => folioObserver.observe(c));
  }

  /* ------------------------------------------------------------------ */
  /* product photo carousels — keep the dots in sync with manual swipes  */
  /* ------------------------------------------------------------------ */

  let carouselObservers = [];

  function wireCarousels() {
    carouselObservers.forEach((o) => o.disconnect());
    carouselObservers = [];

    document.querySelectorAll("[data-carousel]").forEach((carousel) => {
      const track = carousel.querySelector("[data-track]");
      const dots = [...carousel.querySelectorAll("[data-goto]")];
      if (!track || !dots.length) return;

      const slideObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = Number(entry.target.dataset.slide);
          dots.forEach((d, di) => {
            d.classList.toggle("is-active", di === i);
            d.setAttribute("aria-current", di === i ? "true" : "false");
          });
        });
      }, { root: track, threshold: 0.6 });

      track.querySelectorAll("[data-slide]").forEach((slide) => slideObserver.observe(slide));
      carouselObservers.push(slideObserver);
    });
  }

  function wirePage() {
    wireMotion();
    wireFolio();
    wireCarousels();
  }

  // Hydrate to the visitor's preferred language, then wire everything up.
  setLang(detectLang(), false);
  wirePage();
})();
