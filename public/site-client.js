// public/site-client.js — hydration + interactivity.
// The server already rendered real content (see api/index.js), so this script
// only needs to: wire up language switching, category filters and "copy link".
(function () {
  const DATA = window.__SITE_DATA__;
  const SERVER_LANG = window.__SITE_LANG__ || "pt";
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  let currentFilter = "all";

  function detectLang() {
    const stored = localStorage.getItem("lang");
    if (stored === "pt" || stored === "en") return stored;
    const nav = (navigator.language || "pt").toLowerCase();
    return nav.startsWith("pt") ? "pt" : "en";
  }

  function applyFilter(filter) {
    currentFilter = filter;
    app.querySelectorAll(".section[data-category]").forEach((sec) => {
      const inSetup = sec.closest(".setup") != null;
      if (!inSetup) return; // filters only affect "My Setup" sections
      sec.style.display = filter === "all" || sec.dataset.category === filter ? "" : "none";
    });
    app.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.filter === filter);
    });
  }

  function setLang(lang, persist) {
    if (persist) localStorage.setItem("lang", lang);
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
    const btnPt = document.getElementById("btn-pt");
    const btnEn = document.getElementById("btn-en");
    if (btnPt) btnPt.classList.toggle("active", lang === "pt");
    if (btnEn) btnEn.classList.toggle("active", lang === "en");
    if (lang !== SERVER_LANG || persist) {
      app.innerHTML = window.SiteRender.renderApp(DATA, lang);
    }
    applyFilter(currentFilter);
  }

  document.getElementById("btn-pt")?.addEventListener("click", () => setLang("pt", true));
  document.getElementById("btn-en")?.addEventListener("click", () => setLang("en", true));

  // Mobile menu (hamburger) — dropdown panel reusing the same nav-links markup.
  const navEl = document.getElementById("site-nav");
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-links");

  function closeMenu() {
    navEl?.classList.remove("menu-open");
    menuBtn?.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    const open = navEl?.classList.toggle("menu-open");
    menuBtn?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  menuBtn?.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  navLinks?.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("click", (e) => {
    if (navEl?.classList.contains("menu-open") && !navEl.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  app.addEventListener("click", (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      navigator.clipboard.writeText(copyBtn.dataset.copy).then(() => {
        toast.textContent = SERVER_LANG === "en" ? "link copied" : "link copiado";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1800);
      });
      return;
    }
    const chip = e.target.closest("[data-filter]");
    if (chip) applyFilter(chip.dataset.filter);
  });

  // Hydrate to the visitor's preferred language without a visible reflow —
  // this runs synchronously right after the server-rendered content.
  setLang(detectLang(), false);
})();
