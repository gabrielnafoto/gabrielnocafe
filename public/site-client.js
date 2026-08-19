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

    document.getElementById("btn-pt")?.classList.toggle("active", next === "pt");
    document.getElementById("btn-en")?.classList.toggle("active", next === "en");

    // Only re-render when the language actually differs from what the server
    // painted — otherwise we'd throw away perfectly good server markup.
    if (next !== SERVER_LANG || persist) {
      app.innerHTML = window.SiteRender.renderApp(DATA, next);
      wirePage();
    }
  }

  document.getElementById("btn-pt")?.addEventListener("click", () => setLang("pt", true));
  document.getElementById("btn-en")?.addEventListener("click", () => setLang("en", true));

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

  document.getElementById("index-btn")?.addEventListener("click", openIndex);

  document.addEventListener("click", (e) => {
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
  });

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
      document.querySelectorAll(".cover-circle, .chapter-underline").forEach((el) => el.classList.add("drawn"));
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

    document.querySelectorAll(".cover-circle, .chapter-underline").forEach((el) => drawObserver.observe(el));
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

  function wirePage() {
    wireMotion();
    wireFolio();
  }

  // Hydrate to the visitor's preferred language, then wire everything up.
  setLang(detectLang(), false);
  wirePage();
})();
