// public/render-shared.js — isomorphic render module.
// Runs on the server (required by api/index.js, CommonJS) AND in the browser
// (loaded via <script src="/render-shared.js">, attaches to window.SiteRender).
// One copy keeps the server-rendered markup and the client hydration identical.
//
// The site renders as a ZINE: a vertical sequence of "pages", each carrying its
// own palette. Rhythm comes from those palettes alternating — dark, dark,
// CREAM, dark, dark, CREAM — so the cream page lands like an actual printed
// sheet flashing through a dark reel.
//
// The admin data contract is unchanged: every field admin.html writes
// (label, name, description, url, image, affilliate, dailyUse, seenInVideos,
// category, group, number, title, and every _en variant) still drives the page.

(function (root, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  if (typeof window !== "undefined") window.SiteRender = mod;
})(this, function () {
  const I18N = {
    pt: {
      buy: "ver produto", copyLink: "copiar link", copied: "link copiado",
      tried: "testado", daily: "todo santo dia", contents: "índice",
      contentsTitle: "índice", chapter: "capítulo", items: "itens", item: "item",
      videosTitle: "visto nos vídeos", videosDesc: "algumas das coisas que vocês sempre perguntam nos vídeos.",
      archiveTitle: "já testei", archiveDesc: "coisas que passaram pela bancada mas não ficaram no setup atual.",
      more: "mais", close: "fechar", soon: "em breve",
      recipes: "receitas", favorites: "favoritos", back: "voltar ao topo",
      photoCover: "foto — capa", photoChapter: "foto — capítulo", photoProduct: "foto — produto", photoFrame: "frame de vídeo",
      readOn: "role pra ver",
      thisIssue: "esta edição", creditsBy: "fotografado, filmado e editado por",
      gearHeading: "equipamento de gravação",
    },
    en: {
      buy: "view product", copyLink: "copy link", copied: "link copied",
      tried: "tried it", daily: "every single day", contents: "contents",
      contentsTitle: "contents", chapter: "chapter", items: "items", item: "item",
      videosTitle: "seen in my videos", videosDesc: "some of the things you always ask about in my videos.",
      archiveTitle: "already tried", archiveDesc: "things that passed through the counter but didn't stay in the current setup.",
      more: "more", close: "close", soon: "coming soon",
      recipes: "recipes", favorites: "favorites", back: "back to top",
      photoCover: "photo — cover", photoChapter: "photo — chapter", photoProduct: "photo — product", photoFrame: "video frame",
      readOn: "scroll on",
      thisIssue: "this issue", creditsBy: "photographed, filmed and edited by",
      gearHeading: "recording gear",
    },
  };

  // Page palettes cycle so the cream page stays RARE — one in three.
  // Index 0 is the cover (always --ink), so chapters start their own cycle.
  const PAGE_CYCLE = ["page--ink-warm", "page--ink-deep", "page--paper"];

  // How many big fiches a chapter shows before the rest collapses into
  // an archive list. Keeps a 40-item chapter from running forever.
  const FICHE_BUDGET = 4;

  function t(lang, key) { return (I18N[lang] || I18N.pt)[key] || ""; }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Only allow URLs we're willing to put in an href — blocks javascript: etc.
  function safeUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(s)) return s;
    return "";
  }

  function f(obj, field, lang) {
    if (!obj) return "";
    const enVal = obj[field + "_en"];
    return (lang === "en" && enVal) ? enVal : (obj[field] || "");
  }

  function slug(str) {
    return String(str || "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cap";
  }

  function pad2(n, i) {
    const raw = String(n || "").trim();
    if (raw) return raw;
    return String(i + 1).padStart(2, "0");
  }

  // The inverse of splitNote: pulls the FIRST sentence out as a big
  // handwritten "lede", leaving the rest as normal, readable body copy.
  // A whole paragraph set in a script face is exhausting to read — one
  // hooky line in Caveat, then plain text, reads far better.
  function splitLede(text) {
    const s = String(text || "").trim();
    if (!s) return { lede: "", rest: "" };
    // Short enough to read comfortably as one handwritten block on its own —
    // the whole thing IS the lede, nothing repeats underneath.
    if (s.length <= 90) return { lede: s, rest: "" };
    // Longer notes: a short opening phrase acts as a handwritten kicker,
    // and the FULL text (not just the remainder) reads as normal body copy
    // underneath — so nothing is cut or duplicated, just given two paces.
    const words = s.split(/\s+/);
    let lede = "";
    for (const w of words) {
      if ((lede ? lede + " " + w : w).length > 42) break;
      lede = lede ? lede + " " + w : w;
    }
    return { lede: lede ? lede + "…" : "", rest: s };
  }

  // Splits a description into body + handwritten aside. When there's more than
  // one sentence, the LAST one becomes the margin note in Caveat — a personal
  // remark pulled out of prose, no new admin field required.
  function splitNote(desc) {
    const text = String(desc || "").trim();
    if (!text) return { body: "", note: "" };
    const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
    if (!parts || parts.length < 2) return { body: text, note: "" };
    const note = parts.pop().trim();
    const body = parts.join("").trim();
    // Only pull it out if the remark is short enough to read as an aside.
    if (note.length > 90 || !body) return { body: text, note: "" };
    return { body, note };
  }

  /* ---------------------------------------------------------------------- */
  /* photo slots                                                            */
  /* ---------------------------------------------------------------------- */

  // Renders a real image when one is set, otherwise a clearly-marked
  // placeholder that holds the exact composition shape. Gabriel drops photos
  // into `image` (admin) and the layout doesn't move.
  function photo(src, ratio, caption, alt) {
    const url = safeUrl(src);
    if (url) {
      return `<div class="ph ph--${ratio}"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt || "")}" loading="lazy" /></div>`;
    }
    return `<div class="ph ph--${ratio} ph--empty" role="img" aria-label="${escapeHtml(caption || "")}">
      <span>✦<br/>${escapeHtml(caption || "")}<br/>${ratio.replace("x", ":")}</span>
    </div>`;
  }

  /* ---------------------------------------------------------------------- */
  /* doodles — hand-drawn SVG, budgeted at two per screen                   */
  /* ---------------------------------------------------------------------- */

  // Irregular ellipse: deliberately not a perfect circle, so it reads as ink.
  function doodleCircle() {
    return `<svg class="cover-circle" viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M42,78 C28,44 96,16 198,13 C302,10 378,34 380,72 C382,110 300,140 196,139 C92,138 18,116 24,80 C28,54 74,36 140,28" style="--len:1250" />
    </svg>`;
  }

  // Wobbly underline for chapter titles.
  function doodleUnderline() {
    return `<svg class="chapter-underline" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3,8 C64,3 118,10 178,6 C240,2 300,9 397,4" style="--len:420" />
    </svg>`;
  }

  // Small arrow, for the handwritten-note treatment.
  function doodleArrow() {
    return `<svg class="note-arrow" viewBox="0 0 40 32" aria-hidden="true" focusable="false">
      <path d="M3,26 C14,28 27,22 35,7 M26,5 L35,7 L31,16" />
    </svg>`;
  }

  // Single loose mark, for the minimal-doodle treatment — one gesture, nothing more.
  function doodleMark() {
    return `<svg class="mini-doodle" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
      <path d="M13,31 C10,17 27,8 41,11 C54,14 55,29 46,38 C38,47 19,45 14,37 C11,32 13,31 13,31" />
    </svg>`;
  }

  // Long hand-drawn arrow pointing down — sits between an item's text and its
  // photo, a hand pointing at "this one" rather than a UI affordance.
  function doodleDownArrow() {
    return `<svg class="item-arrow" viewBox="0 0 40 90" aria-hidden="true" focusable="false">
      <path d="M20,3 C19,28 21,54 20,76 M6,63 C11,70 16,76 20,80 C24,75 29,68 33,61" />
    </svg>`;
  }

  /* ---------------------------------------------------------------------- */
  /* product image — one fixed frame, five reusable editorial treatments   */
  /* ---------------------------------------------------------------------- */

  // Sensible default corner per treatment when the admin hasn't set one.
  const TREATMENT_DEFAULT_POS = {
    "oversized-type": "bl",
    "handwritten-note": "tr",
    "editorial-number": "br",
    "minimal-doodle": "tr",
  };

  // Everything here draws ON TOP of the photo (typography over image, per the
  // brief) rather than attempting any cutout/mask — .ph already clips
  // overflow, so a treatment can bleed toward an edge without ever risking
  // page-level overflow.
  function editorialOverlay(item, lang, fallbackNumber) {
    const kind = item.editorialTreatment;
    if (!kind) return "";
    const pos = item.annotationPosition || TREATMENT_DEFAULT_POS[kind] || "br";
    const text = f(item, "editorialText", lang);

    if (kind === "oversized-type") {
      if (!text) return "";
      return `<span class="ph-treat ph-treat--type pos-${escapeHtml(pos)}" aria-hidden="true">${escapeHtml(text)}</span>`;
    }
    if (kind === "handwritten-note") {
      if (!text) return "";
      return `<span class="ph-treat ph-treat--note pos-${escapeHtml(pos)}" aria-hidden="true">${doodleArrow()}<em>${escapeHtml(text)}</em></span>`;
    }
    if (kind === "editorial-number") {
      const num = String(item.editorialNumber || fallbackNumber || "").trim();
      if (!num) return "";
      return `<span class="ph-treat ph-treat--number pos-${escapeHtml(pos)}" aria-hidden="true">${escapeHtml(num)}</span>`;
    }
    if (kind === "type-across") {
      if (!text) return "";
      return `<span class="ph-treat ph-treat--across" aria-hidden="true">${escapeHtml(text)}</span>`;
    }
    if (kind === "minimal-doodle") {
      return `<span class="ph-treat ph-treat--doodle pos-${escapeHtml(pos)}" aria-hidden="true">${doodleMark()}</span>`;
    }
    return "";
  }

  // The one frame every product photo uses: fixed 4:5 ratio, same width,
  // same weight. `imagePosition` (object-position) and `imageScale` (a light
  // zoom) let Gabriel reframe a specific photo without ever resizing the
  // frame itself.
  function productMedia(item, lang, fallbackNumber) {
    const url = safeUrl(item.image);
    if (!url) return "";
    const styleParts = [];
    if (item.imagePosition) styleParts.push(`object-position:${item.imagePosition}`);
    const scale = Number(item.imageScale);
    if (scale && scale !== 1 && scale > 0 && scale <= 2) styleParts.push(`transform:scale(${scale})`);
    const styleAttr = styleParts.length ? ` style="${escapeHtml(styleParts.join(";"))}"` : "";
    const overlay = editorialOverlay(item, lang, fallbackNumber);

    return `<div class="ph ph--4x5">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(f(item, "name", lang))}" loading="lazy"${styleAttr} />
      ${overlay}
    </div>`;
  }

  /* ---------------------------------------------------------------------- */
  /* cover                                                                  */
  /* ---------------------------------------------------------------------- */

  function renderCover(data, lang) {
    const p = data.profile || {};
    const s = data.site || {};

    const headline = f(s, "headline", lang) || (lang === "en" ? "what i use." : "o que eu uso.");
    const tagline = f(s, "tagline", lang);
    const role = f(p, "role", lang);

    // Break the headline into up to three lines so it composes like a poster.
    // The final word carries the drawn circle and the coloured full stop.
    const words = headline.trim().split(/\s+/);
    const last = words.pop() || "";
    const lead = words;
    let l1 = "", l2 = "";
    if (lead.length <= 1) {
      l1 = lead.join(" ");
    } else if (lead.length === 2) {
      l1 = lead[0]; l2 = lead[1];
    } else {
      const cut = Math.ceil(lead.length / 2);
      l1 = lead.slice(0, cut).join(" ");
      l2 = lead.slice(cut).join(" ");
    }

    // Split the trailing punctuation so the dot can be coloured on its own.
    const m = last.match(/^(.*?)([.!?]*)$/);
    const lastWord = m ? m[1] : last;
    const lastDot = m ? m[2] : "";

    return `<header class="page cover" id="capa">
      <div class="cover-in">
        ${tagline ? `<span class="cover-kicker">${escapeHtml(tagline)}</span>` : ""}

        <div class="cover-stamp" aria-hidden="true">
          <span>★ CAFÉ<br/>ARTESANAL<br/>EST. 2026</span>
        </div>

        <h1 class="cover-title">
          ${l1 ? `<span class="l1">${escapeHtml(l1)}</span>` : ""}
          ${l2 ? `<span class="l2">${escapeHtml(l2)}</span>` : ""}
          <span class="l3">${escapeHtml(lastWord)}<span class="dot">${escapeHtml(lastDot)}</span>${doodleCircle()}</span>
        </h1>

        <div class="cover-photo"${p.photoPositionY ? ` style="--photo-y:${escapeHtml(p.photoPositionY)}%"` : ""}>
          ${photo(p.photo, "4x5", t(lang, "photoCover"), f(p, "name", lang))}
        </div>

        <div class="cover-meta">
          ${role ? `<span class="cover-role">${escapeHtml(p.name || "")} — ${escapeHtml(role)}</span>` : ""}
          <a class="cover-scroll" href="#colofao">${escapeHtml(t(lang, "readOn"))} <span class="arr" aria-hidden="true">↓</span></a>
        </div>
      </div>
    </header>`;
  }

  /* ---------------------------------------------------------------------- */
  /* colophon                                                               */
  /* ---------------------------------------------------------------------- */

  function renderColophon(data, lang, chapters) {
    const p = data.profile || {};
    const s = data.site || {};
    const intro = f(p, "intro", lang);
    const sub = f(s, "subheadline", lang);
    const bio = f(p, "bio", lang);

    const rows = chapters.map((c) => `<a class="contents-row" href="#${escapeHtml(c.anchor)}">
      <span class="num">${escapeHtml(c.num)}</span>
      <span class="nm">${escapeHtml(c.title)}</span>
      <span class="ct">${c.count}</span>
    </a>`).join("");

    return `<section class="page page--ink colophon" id="colofao">
      <div class="colophon-grid">
        <div class="rise">
          ${sub ? `<p class="colophon-lead">${escapeHtml(sub)}</p>` : ""}
          ${intro ? `<p class="t-body colophon-body">${escapeHtml(intro)}</p>` : ""}
          ${bio ? `<p class="colophon-hand">${escapeHtml(bio)}</p>` : ""}
          ${renderSocials(p)}
        </div>
        ${rows ? `<nav class="rise" aria-label="${escapeHtml(t(lang, "contentsTitle"))}">
          <div class="contents-label">${escapeHtml(t(lang, "contentsTitle"))}</div>
          ${rows}
        </nav>` : ""}
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* daily band                                                             */
  /* ---------------------------------------------------------------------- */

  function renderDaily(sections, lang) {
    const items = [];
    (sections || []).forEach((sec) => (sec.items || []).forEach((it) => { if (it.dailyUse) items.push(it); }));
    if (!items.length) return "";

    const rows = items.map((it) => {
      const url = safeUrl(it.url);
      const name = f(it, "name", lang);
      const label = f(it, "label", lang);
      const inner = `<span class="nm">${escapeHtml(name)}</span>${label ? `<span class="lb">${escapeHtml(label)}</span>` : ""}`;
      return url
        ? `<a class="daily-item" href="${escapeHtml(url)}" target="_blank" rel="noopener sponsored" data-track-id="${escapeHtml(it.id || "")}">${inner}</a>`
        : `<div class="daily-item">${inner}</div>`;
    }).join("");

    return `<section class="page page--ink-deep daily" aria-label="${escapeHtml(t(lang, "daily"))}">
      <div class="daily-head">
        <span class="lbl">✦ ${escapeHtml(t(lang, "daily"))}</span>
        <span class="rule" aria-hidden="true"></span>
      </div>
      <div class="daily-list rise">${rows}</div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* fiches — three layouts alternating by position                         */
  /* ---------------------------------------------------------------------- */

  function ficheActions(item, lang) {
    const url = safeUrl(item.url);
    if (!url) return "";
    return `<div class="fiche-actions">
      <a class="cta" href="${escapeHtml(url)}" target="_blank" rel="noopener sponsored" data-track-id="${escapeHtml(item.id || "")}">${escapeHtml(t(lang, "buy"))} <span class="arr" aria-hidden="true">↗</span></a>
      <button class="copy-link" type="button" data-copy="${escapeHtml(url)}">${escapeHtml(t(lang, "copyLink"))}</button>
    </div>`;
  }

  function ficheLabel(item, lang, isArchive) {
    const label = f(item, "label", lang);
    if (!label && !isArchive) return "";
    return `<div class="fiche-label">
      ${label ? `<span>✦ ${escapeHtml(label)}</span>` : ""}
      ${isArchive ? `<span class="fiche-flag">${escapeHtml(t(lang, "tried"))}</span>` : ""}
    </div>`;
  }

  // Unified item layout — one consistent size/weight for every product photo
  // (small 1:1 frame). `imageAlign` ("left" | "right") lets Gabriel pick which
  // side the photo sits on per item; falls back to alternating by position so
  // a long list still reads with rhythm. When there's no photo, the text
  // simply runs full width — no empty placeholder box.
  function ficheItem(item, lang, index) {
    const { body, note } = splitNote(f(item, "description", lang));
    const media = productMedia(item, lang, pad2(null, index));
    const sideClass = media ? "" : " fiche--no-media";

    const body_ = `<div class="fiche-body">
        ${ficheLabel(item, lang, false)}
        <h3 class="fiche-name">${escapeHtml(f(item, "name", lang))}</h3>
        ${body ? `<p class="fiche-desc">${escapeHtml(body)}</p>` : ""}
        ${note ? `<p class="fiche-note">${escapeHtml(note)}</p>` : ""}
        ${ficheActions(item, lang)}
      </div>`;
    const mediaHtml = media ? `<div class="fiche-media">${media}</div>` : "";
    const arrow = media ? `<span class="item-arrow-wrap" aria-hidden="true">${doodleDownArrow()}</span>` : "";

    return `<article class="fiche fiche--item${sideClass} rise">
      ${body_}${arrow}${mediaHtml}
    </article>`;
  }

  // C — archive line. Dense and fast, after two large fiches.
  function ficheC(item, lang, isArchive) {
    const desc = f(item, "description", lang);
    return `<article class="fiche fiche--c rise">
      ${ficheLabel(item, lang, isArchive)}
      <div class="fiche-row">
        <h3 class="fiche-name">${escapeHtml(f(item, "name", lang))}</h3>
        ${ficheActions(item, lang)}
      </div>
      ${desc ? `<p class="fiche-desc">${escapeHtml(desc)}</p>` : ""}
    </article>`;
  }

  // Every main-list item uses the same unified layout now — ficheC is kept
  // only for the "+N mais" overflow and the archive section, never mixed
  // into the primary alternation (that's what was silently hiding photos).
  function renderFiche(item, index, lang) {
    return ficheItem(item, lang, index);
  }

  /* ---------------------------------------------------------------------- */
  /* chapters                                                               */
  /* ---------------------------------------------------------------------- */

  function renderChapter(sec, lang, meta) {
    const items = sec.items || [];
    const title = f(sec, "title", lang);

    // Long chapters: the first few get full editorial treatment, the rest
    // collapse into an archive list behind a "+ more" toggle.
    const head = items.slice(0, FICHE_BUDGET);
    const rest = items.slice(FICHE_BUDGET);

    const headHtml = head.map((it, i) => renderFiche(it, i, lang)).join("");
    const restHtml = rest.length
      ? `<div class="fiche-rest" id="rest-${escapeHtml(meta.anchor)}" hidden>
           ${rest.map((it) => ficheC(it, lang, false)).join("")}
         </div>
         <button class="more-toggle" type="button" aria-expanded="false" aria-controls="rest-${escapeHtml(meta.anchor)}"
                 data-more data-label-more="+ ${escapeHtml(String(rest.length))} ${escapeHtml(t(lang, "more"))}"
                 data-label-less="− ${escapeHtml(t(lang, "close"))}">
           <span class="more-txt">+ ${escapeHtml(String(rest.length))} ${escapeHtml(t(lang, "more"))}</span>
           <span class="arr" aria-hidden="true">↓</span>
         </button>`
      : "";

    const countTxt = `${items.length} ${items.length === 1 ? t(lang, "item") : t(lang, "items")}`;

    return `<section class="page ${meta.palette} chapter" id="${escapeHtml(meta.anchor)}"
             data-chapter="${escapeHtml(meta.num)}" data-chapter-title="${escapeHtml(title)}">
      <div class="chapter-open">
        <div class="chapter-mark rise">
          <span class="chapter-num" aria-hidden="true">${escapeHtml(meta.num)}</span>
          <h2 class="chapter-title">${escapeHtml(title)}</h2>
          ${doodleUnderline()}
        </div>
        <div class="chapter-intro rise">
          <span class="chapter-count">${escapeHtml(t(lang, "chapter"))} ${escapeHtml(meta.num)} — ${escapeHtml(countTxt)}</span>
        </div>
      </div>
      <div class="chapter-items">${headHtml}${restHtml}</div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* interlude — seen in my videos                                          */
  /* ---------------------------------------------------------------------- */

  function renderInterlude(sections, lang, palette) {
    const items = [];
    (sections || []).forEach((sec) => (sec.items || []).forEach((it) => { if (it.seenInVideos) items.push(it); }));
    if (!items.length) return "";

    const frames = items.map((it) => {
      const url = safeUrl(it.url);
      const name = f(it, "name", lang);
      const label = f(it, "label", lang);
      const inner = `${photo(it.image, "3x4", t(lang, "photoFrame"), name)}
        <div class="frame-cap">
          <span class="nm">${escapeHtml(name)}</span>
          ${label ? `<span class="lb">${escapeHtml(label)}</span>` : ""}
        </div>`;
      return url
        ? `<a class="frame rise" href="${escapeHtml(url)}" target="_blank" rel="noopener sponsored" data-track-id="${escapeHtml(it.id || "")}">${inner}</a>`
        : `<div class="frame rise">${inner}</div>`;
    }).join("");

    return `<section class="page ${palette} interlude" id="videos">
      <div class="interlude-head rise">
        <h2 class="interlude-title">${escapeHtml(t(lang, "videosTitle"))}</h2>
        <p class="interlude-sub">${escapeHtml(t(lang, "videosDesc"))}</p>
      </div>
      <div class="interlude-grid">${frames}</div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* archive — "already tried"                                              */
  /* ---------------------------------------------------------------------- */

  function renderArchive(sections, lang) {
    const otherSections = (sections || []).filter((s) => s.group === "other");
    const items = [];
    otherSections.forEach((sec) => (sec.items || []).forEach((it) => items.push(it)));
    if (!items.length) return "";

    return `<section class="page page--ink-deep archive" id="arquivo">
      <div class="archive-head rise">
        <h2 class="archive-title">${escapeHtml(t(lang, "archiveTitle"))}</h2>
        <p class="archive-sub">${escapeHtml(t(lang, "archiveDesc"))}</p>
      </div>
      <div class="chapter-items">
        ${items.map((it) => ficheC(it, lang, true)).join("")}
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* socials / footnote / back cover                                        */
  /* ---------------------------------------------------------------------- */

  function renderSocials(profile) {
    const links = [
      profile.instagram && `<a href="${escapeHtml(safeUrl(profile.instagram))}" class="social-a" target="_blank" rel="noopener">instagram ↗</a>`,
      profile.youtube && `<a href="${escapeHtml(safeUrl(profile.youtube))}" class="social-a" target="_blank" rel="noopener">youtube ↗</a>`,
      profile.twitter && `<a href="${escapeHtml(safeUrl(profile.twitter))}" class="social-a" target="_blank" rel="noopener">twitter ↗</a>`,
    ].filter(Boolean).join("");
    return links ? `<div class="socials">${links}</div>` : "";
  }

  function renderFootnote(site, lang) {
    const note = f(site, "affiliateNote", lang);
    if (!site.showAffiliateNote || !note) return "";
    return `<aside class="page page--ink footnote">
      <span class="star" aria-hidden="true">✦</span>
      <p>${escapeHtml(note)}</p>
    </aside>`;
  }

  // Turns a plain textarea (one line per item, "Label: Value" or just a bare
  // line) into notebook rows — no image, no admin repeater, just typing.
  function parseGear(text) {
    return String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf(":");
        return i > -1
          ? { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() }
          : { label: "", value: line };
      });
  }

  function renderBackCover(data, lang) {
    const p = data.profile || {};
    const s = data.site || {};
    const title = f(s, "title", lang) || "gabriel no café";
    const credits = f(p, "role", lang);
    const gear = parseGear(f(p, "recordingGear", lang));
    const thanks = f(s, "thanksNote", lang);
    const { lede: thanksLede, rest: thanksRest } = splitLede(thanks);
    const year = new Date().getFullYear();

    const gearRows = gear.map((g) => `<div class="gear-row">
      ${g.label ? `<span class="gear-label">${escapeHtml(g.label)}</span>` : ""}
      <span class="gear-value">${escapeHtml(g.value)}</span>
    </div>`).join("");

    return `<footer class="page page--ink-deep backcover">
      <div class="backcover-in rise">
        <div class="backcover-masthead">
          <span class="backcover-issue">${escapeHtml(t(lang, "thisIssue"))} — ${year}</span>
          <p class="backcover-credits">${escapeHtml(t(lang, "creditsBy"))} ${escapeHtml(p.name || "")}${credits ? ` — ${escapeHtml(credits)}` : ""}</p>
        </div>

        ${gearRows ? `<div class="backcover-gear">
          <span class="gear-heading">✦ ${escapeHtml(t(lang, "gearHeading"))}</span>
          <div class="gear-list">${gearRows}</div>
        </div>` : ""}

        ${thanks ? `<div class="backcover-note">
          ${thanksLede ? `<p class="note-lede">${escapeHtml(thanksLede)}</p>` : ""}
          ${thanksRest ? `<p class="note-rest">${escapeHtml(thanksRest)}</p>` : ""}
        </div>` : ""}

        <span class="backcover-star" aria-hidden="true">✦</span>
      </div>
      <div class="backcover-foot">
        ${renderSocials(p)}
        <div class="backcover-copy">
          ${escapeHtml(title)}<br/>
          ${escapeHtml(p.handle || "")} · © ${year}
        </div>
      </div>
    </footer>`;
  }

  /* ---------------------------------------------------------------------- */
  /* chapter planning — shared by the page, the contents list and the index */
  /* ---------------------------------------------------------------------- */

  // Assigns numbering, anchors and palettes. Palettes cycle so a cream page
  // shows up once every three chapters, never twice in a row.
  function planChapters(sections, lang) {
    return (sections || [])
      .filter((s) => (s.group || "setup") === "setup")
      .map((sec, i) => ({
        sec,
        num: pad2(sec.number, i),
        title: f(sec, "title", lang),
        // Anchor on the stable id, never on the title: titles differ between
        // PT and EN, and a language switch must not invalidate every #link
        // already rendered in the masthead and the contents overlay.
        anchor: `cap-${slug(sec.id || f(sec, "title", "pt") || i)}`,
        count: (sec.items || []).length,
        category: sec.category || "",
        palette: PAGE_CYCLE[i % PAGE_CYCLE.length],
      }));
  }

  // The contents overlay: a real magazine index. Groups by category when there
  // are enough distinct ones to be worth grouping — this is what scales when
  // the catalogue grows.
  function renderIndexOverlay(data, lang) {
    const chapters = planChapters(data.sections || [], lang);
    const cats = [...new Set(chapters.map((c) => c.category).filter(Boolean))];
    const shouldGroup = cats.length >= 3;

    const rowFor = (c) => `<a class="index-item" href="#${escapeHtml(c.anchor)}" data-index-link data-anchor="${escapeHtml(c.anchor)}">
      <span class="num">${escapeHtml(c.num)}</span>
      <span class="name">${escapeHtml(c.title)}</span>
      <span class="count">${c.count}</span>
    </a>`;

    let body;
    if (shouldGroup) {
      body = cats.map((cat) => {
        const inCat = chapters.filter((c) => c.category === cat);
        if (!inCat.length) return "";
        return `<div class="index-group-label">${escapeHtml(cat)}</div>${inCat.map(rowFor).join("")}`;
      }).join("");
      const uncat = chapters.filter((c) => !c.category);
      if (uncat.length) body += uncat.map(rowFor).join("");
    } else {
      body = chapters.map(rowFor).join("");
    }

    const hasArchive = (data.sections || []).some((s) => s.group === "other" && (s.items || []).length);
    const hasVideos = (data.sections || []).some((s) => (s.items || []).some((i) => i.seenInVideos));

    return `<div class="index-overlay" id="index-overlay" role="dialog" aria-modal="true" aria-label="${escapeHtml(t(lang, "contentsTitle"))}">
      <div class="index-top">
        <span class="lbl">✦ ${escapeHtml(t(lang, "contentsTitle"))}</span>
        <button class="index-close" type="button" id="index-close">${escapeHtml(t(lang, "close"))} ✕</button>
      </div>
      <nav class="index-list">
        ${body}
        ${hasVideos ? `<a class="index-item" href="#videos" data-index-link data-anchor="videos"><span class="num">✦</span><span class="name">${escapeHtml(t(lang, "videosTitle"))}</span><span class="count"></span></a>` : ""}
        ${hasArchive ? `<a class="index-item" href="#arquivo" data-index-link data-anchor="arquivo"><span class="num">✦</span><span class="name">${escapeHtml(t(lang, "archiveTitle"))}</span><span class="count"></span></a>` : ""}
      </nav>
      <div class="index-foot">
        <a href="#capa" data-index-link data-anchor="capa">${escapeHtml(t(lang, "back"))}</a>
        <span class="soon">${escapeHtml(t(lang, "recipes"))} — ${escapeHtml(t(lang, "soon"))}</span>
        <span class="soon">${escapeHtml(t(lang, "favorites"))} — ${escapeHtml(t(lang, "soon"))}</span>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------------- */
  /* the zine                                                               */
  /* ---------------------------------------------------------------------- */

  function renderApp(data, lang) {
    const d = data || {};
    const p = d.profile || {};
    const s = d.site || {};
    const sections = d.sections || [];

    const chapters = planChapters(sections, lang);

    // The interlude drops in after the second chapter so the reel breaks up;
    // with fewer chapters it goes at the end of the run.
    const interludeAfter = chapters.length >= 3 ? 1 : chapters.length - 1;

    // Give the interlude a palette that doesn't repeat its neighbour's.
    const interludePalette = PAGE_CYCLE[(interludeAfter + 1) % PAGE_CYCLE.length] === "page--paper"
      ? "page--ink" : "page--paper";

    const chapterHtml = chapters.map((meta, i) => {
      let html = renderChapter(meta.sec, lang, meta);
      if (i === interludeAfter) html += renderInterlude(sections, lang, interludePalette);
      return html;
    }).join("");

    return [
      renderCover(d, lang),
      renderColophon(d, lang, chapters),
      renderDaily(sections, lang),
      chapterHtml,
      renderArchive(sections, lang),
      renderFootnote(s, lang),
      renderBackCover(d, lang),
      renderIndexOverlay(d, lang),
    ].join("\n");
  }

  return {
    t, I18N, escapeHtml, f, safeUrl, slug, planChapters,
    renderApp, renderIndexOverlay, renderSocials,
  };
});
