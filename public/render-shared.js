// public/render-shared.js — isomorphic render module.
// Runs on the server (required by api/index.js, CommonJS) AND in the browser
// (loaded via <script src="/render-shared.js">, attaches to window.SiteRender).
// Keeping one copy avoids the server-rendered markup and the client hydration
// markup drifting apart.

(function (root, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  if (typeof window !== "undefined") window.SiteRender = mod;
})(this, function () {
  const I18N = {
    pt: { buy: "ver produto ↗", copyLink: "copiar link", copied: "link copiado", inSetup: "no setup", tried: "testado", setupTitle: "My Setup", setupDesc: "Coisas que realmente fazem parte da minha rotina.", otherTitle: "Other things I like", otherDesc: "Produtos que já testei ou gostei, mas não necessariamente fazem parte do setup atual.", featuredTitle: "coisas que uso todos os dias", videosTitle: "seen in my videos", videosDesc: "algumas das coisas que vocês sempre perguntam nos vídeos.", aboutTitle: "about", navSetup: "setup", navRecipes: "recipes", navFavorites: "favorites", navAbout: "about", soon: "em breve", filterAll: "todos", menu: "menu" },
    en: { buy: "view product ↗", copyLink: "copy link", copied: "link copied", inSetup: "in setup", tried: "tried it", setupTitle: "My Setup", setupDesc: "Things that are really part of my routine.", otherTitle: "Other things I like", otherDesc: "Products I've tried or liked, but that aren't necessarily part of my current setup.", featuredTitle: "things I use every day", videosTitle: "seen in my videos", videosDesc: "some of the things you always ask about in my videos.", aboutTitle: "about", navSetup: "setup", navRecipes: "recipes", navFavorites: "favorites", navAbout: "about", soon: "coming soon", filterAll: "all", menu: "menu" },
  };

  const CATEGORY_ACCENTS = { espresso: "#e8a856", filter: "#d97a4a", "latte-art": "#c9a63f", apps: "#e0916b", other: "#8a7a68" };
  const CATEGORY_LABELS = {
    pt: { espresso: "Espresso", filter: "Filter", "latte-art": "Latte Art", apps: "Apps", other: "Outros" },
    en: { espresso: "Espresso", filter: "Filter", "latte-art": "Latte Art", apps: "Apps", other: "Other" },
  };

  function t(lang, key) { return (I18N[lang] || I18N.pt)[key] || ""; }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function f(obj, field, lang) {
    if (!obj) return "";
    const enVal = obj[field + "_en"];
    return (lang === "en" && enVal) ? enVal : (obj[field] || "");
  }

  function initials(name) {
    return (name || "S").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  function accentFor(category) { return CATEGORY_ACCENTS[category] || CATEGORY_ACCENTS.other; }

  function renderItemCard(item, lang, isOther) {
    const label = f(item, "label", lang);
    const name = f(item, "name", lang);
    const desc = f(item, "description", lang);
    const url = item.url || "";
    const image = item.image
      ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" width="72" height="72" /></div>`
      : "";
    return `<article class="item">
      ${image}
      <div class="item-body">
        <div class="item-cat">${label ? `✦ ${escapeHtml(label)}` : ""}${isOther ? `<span class="pill-tried">${escapeHtml(t(lang, "tried"))}</span>` : ""}</div>
        <h4 class="item-name">${escapeHtml(name)}</h4>
        ${desc ? `<p class="item-desc">${escapeHtml(desc)}</p>` : ""}
      </div>
      <div class="item-actions">
        ${url ? `<a href="${escapeHtml(url)}" class="btn-main" target="_blank" rel="noopener sponsored">${t(lang, "buy")}</a>` : ""}
        ${url ? `<button class="btn-copy" data-copy="${escapeHtml(url)}">${t(lang, "copyLink")}</button>` : ""}
      </div>
    </article>`;
  }

  function renderSection(sec, lang, isOther) {
    const accent = isOther ? "var(--dim)" : accentFor(sec.category);
    const items = (sec.items || []).map((i) => renderItemCard(i, lang, isOther)).join("");
    return `<div class="section" style="--accent:${accent}" data-category="${escapeHtml(sec.category || "other")}">
      <div class="section-head">
        <div class="section-num">${escapeHtml(sec.number || "")}</div>
        <h3 class="section-title">${escapeHtml(f(sec, "title", lang))}</h3>
      </div>
      ${items}
    </div>`;
  }

  function renderFeaturedStrip(sections, lang) {
    const items = [];
    (sections || []).forEach((sec) => (sec.items || []).forEach((it) => { if (it.dailyUse) items.push(it); }));
    if (!items.length) return "";
    const cells = items.map((it) => `<a class="featured-pill" href="${escapeHtml(it.url || "#")}" target="_blank" rel="noopener sponsored">
      <span class="featured-pill-name">${escapeHtml(f(it, "name", lang))}</span>
      <span class="featured-pill-cat">${escapeHtml(f(it, "label", lang))}</span>
    </a>`).join("");
    return `<section class="featured" aria-label="${escapeHtml(t(lang, "featuredTitle"))}">
      <div class="featured-head">${escapeHtml(t(lang, "featuredTitle"))}</div>
      <div class="featured-strip">${cells}</div>
    </section>`;
  }

  function renderSeenInVideos(sections, lang) {
    const items = [];
    (sections || []).forEach((sec) => (sec.items || []).forEach((it) => { if (it.seenInVideos) items.push(it); }));
    if (!items.length) return "";
    const cells = items.map((it) => `<a class="video-card" href="${escapeHtml(it.url || "#")}" target="_blank" rel="noopener sponsored">
      <span class="video-card-tag">🎥</span>
      <span class="video-card-name">${escapeHtml(f(it, "name", lang))}</span>
      <span class="video-card-cat">${escapeHtml(f(it, "label", lang))}</span>
    </a>`).join("");
    return `<section class="seen-videos" id="videos">
      <div class="alt-head"><h2>${escapeHtml(t(lang, "videosTitle"))}</h2><p>${escapeHtml(t(lang, "videosDesc"))}</p></div>
      <div class="videos-strip">${cells}</div>
    </section>`;
  }

  function renderFilters(sections, lang) {
    const setupSections = (sections || []).filter((s) => (s.group || "setup") === "setup");
    const cats = [...new Set(setupSections.map((s) => s.category).filter(Boolean))];
    if (cats.length < 2) return "";
    const chips = [`<button class="chip active" data-filter="all">${escapeHtml(t(lang, "filterAll"))}</button>`]
      .concat(cats.map((c) => `<button class="chip" data-filter="${escapeHtml(c)}"><span class="chip-dot" style="background:${accentFor(c)}"></span>${escapeHtml((CATEGORY_LABELS[lang] || CATEGORY_LABELS.pt)[c] || c)}</button>`));
    return `<div class="filters" role="tablist" aria-label="filtrar equipamentos">${chips.join("")}</div>`;
  }

  function renderSetup(sections, lang) {
    const setupSections = (sections || []).filter((s) => (s.group || "setup") === "setup");
    if (!setupSections.length) return "";
    return `<section class="setup" id="setup">
      <div class="setup-head">
        <h2>${escapeHtml(t(lang, "setupTitle"))}</h2>
        <p>${escapeHtml(t(lang, "setupDesc"))}</p>
      </div>
      ${renderFilters(sections, lang)}
      ${setupSections.map((s) => renderSection(s, lang, false)).join("")}
    </section>`;
  }

  function renderOtherThings(sections, lang) {
    const otherSections = (sections || []).filter((s) => s.group === "other");
    if (!otherSections.length) return "";
    return `<section class="other-things" id="other">
      <div class="alt-head"><h2>${escapeHtml(t(lang, "otherTitle"))}</h2><p>${escapeHtml(t(lang, "otherDesc"))}</p></div>
      ${otherSections.map((s) => renderSection(s, lang, true)).join("")}
    </section>`;
  }

  function renderAbout(profile, lang) {
    const intro = f(profile, "intro", lang);
    if (!intro) return "";
    return `<section class="about" id="about">
      <h2>${escapeHtml(t(lang, "aboutTitle"))}</h2>
      <p>${escapeHtml(intro)}</p>
    </section>`;
  }

  function renderSocials(profile) {
    return [
      profile.instagram && `<a href="${escapeHtml(profile.instagram)}" class="social-a" target="_blank" rel="noopener">instagram ↗</a>`,
      profile.youtube && `<a href="${escapeHtml(profile.youtube)}" class="social-a" target="_blank" rel="noopener">youtube ↗</a>`,
      profile.twitter && `<a href="${escapeHtml(profile.twitter)}" class="social-a" target="_blank" rel="noopener">twitter ↗</a>`,
    ].filter(Boolean).join("");
  }

  function renderApp(data, lang) {
    const d = data || {};
    const p = d.profile || {};
    const s = d.site || {};
    const sections = d.sections || [];

    const tagline = f(s, "tagline", lang);
    const headline = f(s, "headline", lang) || "o que eu uso.";
    const sub = f(s, "subheadline", lang);
    const role = f(p, "role", lang);
    const intro = f(p, "intro", lang);
    const bio = f(p, "bio", lang);
    const affiliate = f(s, "affiliateNote", lang);

    const words = headline.split(" ");
    const last = words.pop();
    const rest = words.join(" ");

    const avatar = p.photo ? `<img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name || "")}" />` : escapeHtml(initials(p.name));
    const socialLinks = renderSocials(p);

    return `
      <section class="hero">
        <div class="stamp" aria-hidden="true"><div class="stamp-text">CAFÉ<br/>ARTESANAL<br/>★ EST. 2026</div></div>
        ${tagline ? `<div class="hero-kicker-badge"><span class="dot"></span><span>${escapeHtml(tagline)}</span></div>` : ""}
        <h1 class="hero-h1">${escapeHtml(rest)} <span class="accent">${escapeHtml(last)}<span class="circle-mark"></span></span></h1>
        ${sub ? `<p class="hero-sub">${escapeHtml(sub)}</p>` : ""}

        <div class="hero-person">
          <div class="photo-frame">${avatar}</div>
          <div class="hero-person-body">
            <div class="hero-person-name">${escapeHtml(p.name || "")}${role ? `<span class="hero-person-role"> — ${escapeHtml(role)}</span>` : ""}</div>
            ${intro ? `<p class="hero-person-intro">${escapeHtml(intro)}</p>` : (bio ? `<p class="hero-person-intro">${escapeHtml(bio)}</p>` : "")}
            ${socialLinks ? `<div class="socials">${socialLinks}</div>` : ""}
          </div>
        </div>
      </section>

      ${renderFeaturedStrip(sections, lang)}
      ${renderSetup(sections, lang)}
      ${renderSeenInVideos(sections, lang)}
      ${renderOtherThings(sections, lang)}
      ${renderAbout(p, lang)}

      ${s.showAffiliateNote && affiliate ? `<div class="affiliate-note">☕ ${escapeHtml(affiliate)}</div>` : ""}

      <footer class="footer">
        <div class="footer-brand">${escapeHtml(f(s, "title", lang) || "gabriel no café")} ✦</div>
        ${socialLinks ? `<div class="socials">${socialLinks}</div>` : ""}
      </footer>
    `;
  }

  return { t, I18N, escapeHtml, f, initials, accentFor, CATEGORY_ACCENTS, renderApp };
});
