// public/site-client.js — hydration + interactivity for the zine.
//
// The server already rendered the whole publication (see api/index.js), so this
// script only adds behaviour: language switching, the contents overlay, the
// running folio, "+ more" toggles, copy-link, and the entrance/doodle motion.
(function () {
  const DATA = window.__SITE_DATA__ || {};
  const SERVER_LANG = window.__SITE_LANG__ || "pt";
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");

  let lang = SERVER_LANG;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    lang = next;
    if (persist) localStorage.setItem("lang", next);
    document.documentElement.lang = next === "en" ? "en" : "pt-BR";

    // Only re-render when the language actually differs from what the server
    // painted — otherwise we'd throw away perfectly good server markup.
    if (next !== SERVER_LANG || persist) {
      // The overlay's own markup is inside #app, so re-rendering destroys it
      // while body.index-open (overflow:hidden) stayed behind — the page then
      // looked fine and simply refused to scroll. Reset the state first.
      closeIndex({ restoreFocus: false });
      const mast = document.getElementById("masthead");
      if (mast) mast.innerHTML = window.SiteRender.renderMasthead(DATA, next);
      app.innerHTML = window.SiteRender.renderApp(DATA, next);
      wirePage();
      // Re-rendering the header replaced the button that was just clicked;
      // put focus back on its counterpart so keyboard users aren't dropped.
      if (persist) document.getElementById(next === "en" ? "btn-en" : "btn-pt")?.focus();
    }

    document.getElementById("btn-pt")?.classList.toggle("active", next === "pt");
    document.getElementById("btn-en")?.classList.toggle("active", next === "en");
    document.getElementById("btn-pt")?.setAttribute("aria-pressed", String(next === "pt"));
    document.getElementById("btn-en")?.setAttribute("aria-pressed", String(next === "en"));
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

  function closeIndex(opts) {
    const restoreFocus = !opts || opts.restoreFocus !== false;
    // body/button state is reset even when the overlay element itself is gone
    // (a language switch re-renders it), so the page can never stay locked.
    document.body.classList.remove("index-open");
    document.getElementById("index-btn")?.setAttribute("aria-expanded", "false");
    const ov = overlay();
    if (ov) ov.classList.remove("open");
    if (restoreFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // Highlight the chapter the reader is currently in, so the contents page
  // doubles as a "you are here" marker.
  function markCurrentInIndex() {
    const current = document.querySelector(".masthead")?.dataset.currentAnchor;
    document.querySelectorAll("[data-index-link]").forEach((a) => {
      a.classList.toggle("current", !!current && a.dataset.anchor === current);
    });
  }

  // Delegated, not bound to the elements themselves: the masthead is
  // re-rendered on a language switch, which would leave direct listeners
  // attached to detached nodes (the toggle would then only work once).
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
  /* copy link + "+ more" toggles                                       */
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

    const more = e.target.closest("[data-more]");
    if (more) {
      const panel = document.getElementById(more.getAttribute("aria-controls"));
      if (!panel) return;
      const open = panel.hasAttribute("hidden");
      if (open) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
      more.setAttribute("aria-expanded", open ? "true" : "false");
      const txt = more.querySelector(".more-txt");
      if (txt) txt.textContent = open ? more.dataset.labelLess : more.dataset.labelMore;
      // Newly revealed fiches should settle in like the rest of the page.
      if (open) panel.querySelectorAll(".rise").forEach((el) => el.classList.add("in"));
    }

    const chapterToggle = e.target.closest("[data-chapter-toggle]");
    if (chapterToggle) toggleChapter(chapterToggle);

    const carouselNav = e.target.closest("[data-nav]");
    if (carouselNav) {
      const track = carouselNav.closest("[data-carousel]")?.querySelector("[data-track]");
      if (track) {
        const dir = Number(carouselNav.dataset.nav);
        track.scrollBy({ left: track.clientWidth * dir, behavior: "smooth" });
      }
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

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const chapterToggle = e.target.closest("[data-chapter-toggle]");
    if (!chapterToggle) return;
    e.preventDefault();
    toggleChapter(chapterToggle);
  });

  /* ------------------------------------------------------------------ */
  /* chapters: click a chapter's own opener to reveal/hide its products  */
  /* ------------------------------------------------------------------ */

  // Only one chapter open at a time — opening one collapses whichever
  // other chapter was open, so the page never stacks up several long lists.
  function toggleChapter(toggle, forceOpen, keepScroll) {
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!panel) return;
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    const willOpen = forceOpen !== undefined ? forceOpen : !isOpen;
    if (willOpen === isOpen) return;

    if (willOpen) {
      document.querySelectorAll("[data-chapter-toggle][aria-expanded='true']").forEach((other) => {
        if (other !== toggle) toggleChapter(other, false);
      });
      panel.removeAttribute("hidden");
      panel.querySelectorAll(".rise").forEach((el) => el.classList.add("in"));
      // Carousels inside a chapter that was hidden had a zero-size root
      // when wireCarousels() first ran — re-observe now that it's visible.
      wireCarousels();
      // Collapsing an earlier chapter shrinks everything above this one,
      // so the page jumps and the chapter you just opened can land
      // mid-viewport instead of at the top. Pin its own header back to the
      // top of the screen once the collapse has actually happened.
      if (!keepScroll) {
        requestAnimationFrame(() => {
          toggle.closest(".chapter")?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      }
    } else {
      panel.setAttribute("hidden", "");
    }
    toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }

  // Arriving via a chapter link (index overlay, masthead nav, a direct
  // #cap-... URL) should open that chapter instead of scrolling to a
  // closed, empty-looking header.
  function openChapterFromHash() {
    const id = location.hash.slice(1);
    if (!id) return;
    const section = document.getElementById(id);
    const toggle = section?.querySelector("[data-chapter-toggle]");
    // The browser's own anchor jump already scrolls here — don't fight it
    // with a second, competing scrollIntoView.
    if (toggle) toggleChapter(toggle, true, true);
  }

  window.addEventListener("hashchange", openChapterFromHash);

  /* ------------------------------------------------------------------ */
  /* motion: entrances, drawn doodles, running folio                    */
  /* ------------------------------------------------------------------ */

  let riseObserver = null;
  let drawObserver = null;
  let folioObserver = null;

  function wireMotion() {
    riseObserver?.disconnect();
    drawObserver?.disconnect();

    if (reduceMotion) {
      document.querySelectorAll(".rise").forEach((el) => el.classList.add("in"));
      document.querySelectorAll(".cover-circle, .chapter-underline, .cover-role").forEach((el) => el.classList.add("drawn"));
      return;
    }

    // Content settles in a few pixels — nothing more theatrical than that.
    riseObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        riseObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    document.querySelectorAll(".rise").forEach((el) => riseObserver.observe(el));

    // Doodles draw themselves once, when they come into view.
    drawObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("drawn");
        drawObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll(".cover-circle, .chapter-underline, .cover-role").forEach((el) => drawObserver.observe(el));
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
        // mean nothing is current — right at a chapter boundary, a chapter
        // can flicker in/out of that band across consecutive frames (scroll
        // jitter, the mobile browser's own toolbar resizing the viewport).
        // Only actually clear once we're above the very first chapter or
        // below the very last one; otherwise keep showing the last chapter
        // we were confidently in, rather than flashing the brand on and off.
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
      folio.innerHTML = `<span class="n">${el.dataset.chapter}</span> ${el.dataset.chapterTitle}`;
      masthead.dataset.currentAnchor = el.id;
      // Tint the sticky header with the current chapter's own palette —
      // reinforces "you're in a different chapter now" right where the eye
      // already lands to check position.
      masthead.dataset.palette = el.dataset.palette || "";
      // The desktop nav and the (possibly open) contents overlay both double
      // as "you are here" markers — keep them live as the reader scrolls,
      // not just at the moment the overlay happens to open.
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
    openChapterFromHash();
  }

  // Hydrate to the visitor's preferred language, then wire everything up.
  setLang(detectLang(), false);
  wirePage();
})();
