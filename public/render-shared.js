// public/render-shared.js — isomorphic render module.
// Runs on the server (required by api/index.js, CommonJS) AND in the browser
// (loaded via <script src="/render-shared.js">, attaches to window.SiteRender).
// One copy keeps the server-rendered markup and the client hydration identical.
//
// The site renders as a ZINE built like a photographer's CONTACT SHEET: the
// cover is two registers (a typographic top, a full-bleed strip of numbered
// frames below), and every chapter lays its copy beside numbered square
// frames. Rhythm comes from palettes alternating — dark, dark, CREAM — so the
// cream page lands like an actual printed sheet flashing through a dark reel.
//
// Nothing on the page is hidden behind a click and nothing animates its own
// height or position on entrance: the whole publication is present in the
// server HTML, which is what keeps layout shift at zero.
//
// The admin data contract is unchanged: every field admin.html writes
// (label, name, description, url, image, gallery, affilliate, dailyUse,
// seenInVideos, category, group, number, title, editorialTreatment,
// editorialStyle, imagePosition, imageScale, and every _en variant) still
// drives the page.

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
      skipToContent: "pular para o conteúdo",
      // contact-sheet vocabulary
      contactSheet: "contact sheet", frames: "frames", frame: "frame",
      fileLabel: "a ficha", affiliate: "afiliado",
      chapters: "capítulos",
      colophonTitle: "colofão", colophonSub: "quem escreve isso aqui",
      dailyDesc: "o que sai da bancada toda manhã, sem exceção.",
      affiliateTitle: "nota de afiliado",
      prevPhoto: "foto anterior", nextPhoto: "próxima foto",
      photoOf: "foto {i} de {n}",
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
      skipToContent: "skip to content",
      contactSheet: "contact sheet", frames: "frames", frame: "frame",
      fileLabel: "the file", affiliate: "affiliate",
      chapters: "chapters",
      colophonTitle: "colophon", colophonSub: "who writes this",
      dailyDesc: "what comes off the counter every morning, no exceptions.",
      affiliateTitle: "affiliate note",
      prevPhoto: "previous photo", nextPhoto: "next photo",
      photoOf: "photo {i} of {n}",
    },
  };

  // Page palettes cycle so the cream page stays RARE — one in three.
  // Index 0 is the cover (always --ink), so chapters start their own cycle.
  const PAGE_CYCLE = ["page--ink-warm", "page--ink-deep", "page--paper"];

  function t(lang, key) { return (I18N[lang] || I18N.pt)[key] || ""; }

  function tf(lang, key, vars) {
    return String(t(lang, key)).replace(/\{(\w+)\}/g, (_, k) => String((vars || {})[k] == null ? "" : vars[k]));
  }

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

  // Frame counter, contact-sheet style: 01/04.
  function frameNo(i, total) {
    return `${String(i + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
  }

  // The inverse of splitNote: pulls the FIRST sentence out as a big
  // handwritten "lede", leaving the rest as normal, readable body copy.
  // A whole paragraph set in a script face is exhausting to read — one
  // hooky line in Caveat, then plain text, reads far better.
  function splitLede(text) {
    const s = String(text || "").trim();
    if (!s) return { lede: "", rest: "" };
    if (s.length <= 90) return { lede: s, rest: "" };
    const words = s.split(/\s+/);
    let lede = "";
    for (const w of words) {
      if ((lede ? lede + " " + w : w).length > 42) break;
      lede = lede ? lede + " " + w : w;
    }
    return { lede: lede ? lede + "…" : "", rest: s };
  }

  // Splits a sentence-y field into body + a short trailing remark. Used twice:
  // for a product description (body + margin note) and for site.subheadline,
  // whose closing sentence becomes the cover's right-hand lede while the
  // opening sentence carries the colophon — one field, two placements, and
  // never the same words printed twice.
  function splitNote(desc) {
    const text = String(desc || "").trim();
    if (!text) return { body: "", note: "" };
    const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
    if (!parts || parts.length < 2) return { body: text, note: "" };
    const note = parts.pop().trim();
    const body = parts.join("").trim();
    if (note.length > 110 || !body) return { body: text, note: "" };
    return { body, note };
  }

  /* ---------------------------------------------------------------------- */
  /* photo pool                                                             */
  /* ---------------------------------------------------------------------- */

  // Every real photograph in the publication, in reading order: the portrait
  // first, then each product's cover shot and its gallery. The contact strip
  // and the colophon tiles draw from this pool, which means both fill in
  // automatically as Gabriel adds photos in admin — no extra fields, and no
  // hatched "FOTO — CAPA" placeholder ever ships to a visitor. When the pool
  // is empty those slots simply don't render (see renderContactStrip).
  function collectPhotos(data) {
    const out = [];
    const push = (u) => {
      const s = safeUrl(u);
      if (s && out.indexOf(s) === -1) out.push(s);
    };
    push((data.profile || {}).photo);
    (data.sections || []).forEach((sec) => (sec.items || []).forEach((it) => {
      push(it.image);
      (it.gallery || []).forEach(push);
    }));
    return out;
  }

  // Wraps around the pool so a slot always gets *a* photograph when at least
  // one exists — a contact sheet reprinting a frame is normal, an empty cell
  // in a printed grid is not.
  function pick(pool, i) {
    if (!pool.length) return "";
    return pool[i % pool.length];
  }

  /* ---------------------------------------------------------------------- */
  /* frames — one figure primitive, numbered like a contact sheet            */
  /* ---------------------------------------------------------------------- */

  // Renders a numbered photographic frame. Never renders anything at all
  // without a real image: callers decide how the layout absorbs the absence.
  function frame(src, opts) {
    const o = opts || {};
    const url = safeUrl(src);
    if (!url) return "";
    const ratio = o.ratio || "1x1";
    const cls = ["ph", `ph--${ratio}`, o.className].filter(Boolean).join(" ");
    const load = o.eager
      ? `loading="eager" fetchpriority="high" decoding="async"`
      : `loading="lazy" decoding="async"`;
    const style = o.style ? ` style="${escapeHtml(o.style)}"` : "";
    const cap = o.num ? `<figcaption class="frame-no">${escapeHtml(o.num)}</figcaption>` : "";
    return `<figure class="${cls}">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(o.alt || "")}" ${load}${style} />
      ${o.overlay || ""}${cap}
    </figure>`;
  }

  // imagePosition (object-position) and imageScale (a light zoom) are
  // admin-editable and apply to an item's own cover shot only.
  function mediaStyle(item) {
    const parts = [];
    if (item.imagePosition) parts.push(`object-position:${item.imagePosition}`);
    const scale = Number(item.imageScale);
    if (scale && scale !== 1 && scale > 0 && scale <= 2) parts.push(`transform:scale(${scale})`);
    return parts.join(";");
  }

  // 2+ gallery photos share one frame as a scroll-snap carousel — native
  // swipe on touch, arrows + dots on pointer devices, no library.
  function carouselFrame(photos, name, lang, num) {
    const slides = photos.map((url, i) =>
      `<div class="ph-slide" data-slide="${i}">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(name)} — ${i + 2}" loading="lazy" decoding="async" />
      </div>`).join("");
    const dots = photos.map((_, i) =>
      `<button type="button" class="ph-dot${i === 0 ? " is-active" : ""}" data-goto="${i}"
        aria-label="${escapeHtml(tf(lang, "photoOf", { i: i + 1, n: photos.length }))}"
        aria-current="${i === 0 ? "true" : "false"}"></button>`).join("");

    return `<figure class="ph ph--1x1 ph--carousel fiche-frame" data-carousel>
      <div class="ph-track" data-track tabindex="0" role="group" aria-label="${photos.length} ${escapeHtml(t(lang, "frames"))}">${slides}</div>
      <button type="button" class="ph-nav ph-nav--prev" data-nav="-1" aria-label="${escapeHtml(t(lang, "prevPhoto"))}">‹</button>
      <button type="button" class="ph-nav ph-nav--next" data-nav="1" aria-label="${escapeHtml(t(lang, "nextPhoto"))}">›</button>
      <div class="ph-dots">${dots}</div>
      ${num ? `<figcaption class="frame-no">${escapeHtml(num)}</figcaption>` : ""}
    </figure>`;
  }

  /* ---------------------------------------------------------------------- */
  /* doodles — hand-drawn SVG, budgeted at two per screen                   */
  /* ---------------------------------------------------------------------- */

  // The cover scribble: a loose ellipse that fully ENCLOSES the last word and
  // loops back past its final letter, the way you'd ring a word with a pen.
  function doodleCircle() {
    return `<svg class="cover-circle" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M42,148 C36,78 220,26 504,20 C790,14 964,66 958,146 C952,226 748,284 462,288 C216,291 54,250 34,172 C20,116 132,66 350,44 C520,27 730,22 892,32 C946,35 972,44 984,58" style="--len:3200" />
    </svg>`;
  }

  // Full-measure wobbly rule under a chapter header.
  function doodleUnderline() {
    return `<svg class="chapter-underline" viewBox="0 0 1200 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3,9 C160,4 320,11 486,6 C640,2 812,10 968,5 C1064,2 1140,8 1197,5" style="--len:1300" />
    </svg>`;
  }

  // Short rule, for the daily band's intro column.
  function doodleRule() {
    return `<svg class="mini-rule" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M2,7 C46,3 92,9 138,5 C182,1 232,8 298,4" style="--len:340" />
    </svg>`;
  }

  // Small arrow, for the handwritten-note photo treatment.
  function doodleArrow() {
    return `<svg class="note-arrow" viewBox="0 0 40 32" aria-hidden="true" focusable="false">
      <path d="M3,26 C14,28 27,22 35,7 M26,5 L35,7 L31,16" />
    </svg>`;
  }

  // Single loose mark, for the minimal-doodle treatment.
  function doodleMark() {
    return `<svg class="mini-doodle" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
      <path d="M13,31 C10,17 27,8 41,11 C54,14 55,29 46,38 C38,47 19,45 14,37 C11,32 13,31 13,31" />
    </svg>`;
  }

  // Long hand-drawn arrow, for the arrow-note block gesture.
  function doodleDownArrow() {
    return `<svg class="item-arrow" viewBox="0 0 40 90" aria-hidden="true" focusable="false">
      <path d="M20,3 C19,28 21,54 20,76 M6,63 C11,70 16,76 20,80 C24,75 29,68 33,61" />
    </svg>`;
  }

  /* ---------------------------------------------------------------------- */
  /* product image treatments — five reusable editorial interventions        */
  /* ---------------------------------------------------------------------- */

  const TREATMENT_DEFAULT_POS = {
    "oversized-type": "bl",
    "handwritten-note": "tr",
    "editorial-number": "br",
    "minimal-doodle": "tr",
  };

  // Everything here draws ON TOP of the photo (typography over image) rather
  // than attempting any cutout/mask — .ph already clips overflow, so a
  // treatment can bleed toward an edge without risking page-level overflow.
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

  /* ---------------------------------------------------------------------- */
  /* product block gesture — one optional graphic move in the block's own    */
  /* empty space (not on the photo). At most one per item, by design.        */
  /* ---------------------------------------------------------------------- */

  function blockGesture(item, lang, fallbackNumber) {
    const style = item.editorialStyle;
    if (!style || style === "clean") return "";
    const pos = item.annotationPosition || "br";

    if (style === "personal-note") {
      const note = f(item, "personalNote", lang);
      if (!note) return "";
      return `<p class="block-note pos-${escapeHtml(pos)}" aria-hidden="true">${escapeHtml(note)}</p>`;
    }
    if (style === "oversized-word") {
      const word = f(item, "editorialText", lang);
      if (!word) return "";
      return `<span class="block-word pos-${escapeHtml(pos)}" aria-hidden="true">${escapeHtml(word)}</span>`;
    }
    if (style === "editorial-number") {
      const num = String(item.editorialNumber || fallbackNumber || "").trim();
      if (!num) return "";
      return `<span class="block-number pos-${escapeHtml(pos)}" aria-hidden="true">${escapeHtml(num)}</span>`;
    }
    if (style === "arrow-note") {
      const note = f(item, "personalNote", lang);
      if (!note) return "";
      return `<p class="block-arrow-note pos-${escapeHtml(pos)}" aria-hidden="true">${doodleDownArrow()}<span>${escapeHtml(note)}</span></p>`;
    }
    return "";
  }

  /* ---------------------------------------------------------------------- */
  /* 01 — cover: two registers                                              */
  /* ---------------------------------------------------------------------- */

  // The strip is the cover's bottom register: three photographs and one
  // burnt-red typographic frame carrying the handwritten role line, all
  // numbered like a contact sheet. The type frame is ALWAYS present, so with
  // no photographs at all the strip degrades to a single full-width red
  // band — still a deliberate composition, never an empty grid.
  function renderContactStrip(data, lang) {
    const p = data.profile || {};
    const role = f(p, "role", lang);
    const name = p.name || "";
    const photos = collectPhotos(data).slice(0, 3);

    const cells = [];
    if (photos[0]) cells.push({ kind: "photo", src: photos[0], eager: true });
    cells.push({ kind: "type" });
    if (photos[1]) cells.push({ kind: "photo", src: photos[1] });
    if (photos[2]) cells.push({ kind: "photo", src: photos[2] });

    const total = cells.length;
    const alt = [name, role].filter(Boolean).join(" — ");

    const html = cells.map((cell, i) => {
      if (cell.kind === "type") {
        return `<div class="strip-tile">
          <span class="t-meta strip-tile-label">${escapeHtml(t(lang, "fileLabel"))}</span>
          <p class="strip-tile-hand">${escapeHtml(alt)}</p>
          <span class="frame-no">${frameNo(i, total)}</span>
        </div>`;
      }
      return frame(cell.src, {
        ratio: "4x5",
        alt,
        num: frameNo(i, total),
        eager: cell.eager,
        className: "strip-frame",
      });
    }).join("");

    return {
      count: total,
      html: `<div class="strip" style="--strip-cols:${total}">${html}</div>`,
    };
  }

  function renderCover(data, lang) {
    const p = data.profile || {};
    const s = data.site || {};

    const headline = f(s, "headline", lang) || (lang === "en" ? "it's just an espresso." : "é só um café.");
    const tagline = f(s, "tagline", lang);
    // The subheadline's closing sentence rides the cover; its opening sentence
    // carries the colophon. Same admin field, two placements, no repetition.
    const lede = splitNote(f(s, "subheadline", lang)).note;

    // Two lines: everything up to the last word, then the last word — which
    // takes the drawn scribble and the coloured full stop.
    const words = headline.trim().split(/\s+/);
    const last = words.pop() || "";
    const lead = words.join(" ");
    const m = last.match(/^(.*?)([.!?]*)$/);
    const lastWord = m ? m[1] : last;
    const lastDot = m ? m[2] : "";

    const strip = renderContactStrip(data, lang);

    return `<header class="page page--ink cover" id="capa">
      <div class="cover-in">
        <div class="cover-rule">
          <span class="t-meta cover-kicker">${escapeHtml(tagline)}</span>
          <span class="t-meta cover-handle">${escapeHtml(p.handle || "")}</span>
        </div>

        <div class="cover-head">
          <h1 class="cover-title">
            ${lead ? `<span class="l1">${escapeHtml(lead)}</span>` : ""}
            <span class="l2">${escapeHtml(lastWord)}<span class="dot">${escapeHtml(lastDot)}</span>${doodleCircle()}</span>
          </h1>
          ${lede ? `<p class="t-body cover-lede">${escapeHtml(lede)}</p>` : ""}
        </div>

        <div class="cover-cue">
          <a class="t-meta cover-scroll" href="#colofao">${escapeHtml(t(lang, "readOn"))} <span class="arr" aria-hidden="true">↓</span></a>
          <span class="t-meta cover-strip-meta">${escapeHtml(t(lang, "contactSheet"))} — ${String(strip.count).padStart(2, "0")} ${escapeHtml(t(lang, "frames"))}</span>
        </div>
      </div>
      ${strip.html}
    </header>`;
  }

  /* ---------------------------------------------------------------------- */
  /* 02 — colophon: a modular block, copy left, two square frames right      */
  /* ---------------------------------------------------------------------- */

  function renderColophon(data, lang) {
    const p = data.profile || {};
    const s = data.site || {};
    const lead = splitNote(f(s, "subheadline", lang)).body;
    const intro = f(p, "intro", lang);
    const bio = f(p, "bio", lang);

    const pool = collectPhotos(data);
    // Reach past the three frames the cover already printed when the pool is
    // deep enough; wrap around when it isn't. Never print the same frame twice
    // side by side — one tile reads as a choice, two identical ones as a bug.
    const tiles = [];
    [3, 4].forEach((i) => {
      const url = pick(pool, i);
      if (url && tiles.indexOf(url) === -1) tiles.push(url);
    });

    // The recording gear doubles as a production credit line, joined from the
    // same "Label: Value" textarea the back cover reads.
    const credit = parseGear(f(p, "recordingGear", lang))
      .map((g) => g.value).filter(Boolean).join(" · ");

    const tilesHtml = tiles.map((url, i) => frame(url, {
      ratio: "1x1",
      alt: f(p, "name", lang),
      num: String.fromCharCode(65 + i),
      className: "colophon-tile",
    })).join("");

    return `<section class="page page--ink colophon" id="colofao">
      <div class="colophon-in">
        <div class="section-head">
          <span class="t-meta section-lbl">✦ ${escapeHtml(t(lang, "colophonTitle"))}</span>
          <span class="t-meta section-sub">${escapeHtml(t(lang, "colophonSub"))}</span>
        </div>

        <div class="colophon-grid">
          <div class="colophon-main">
            ${lead ? `<p class="colophon-lead">${escapeHtml(lead)}</p>` : ""}
            ${intro ? `<p class="t-body colophon-body">${escapeHtml(intro)}</p>` : ""}
            <div class="colophon-foot">
              ${renderSocials(p)}
              ${credit ? `<span class="t-meta colophon-credit">${escapeHtml(credit)}</span>` : ""}
            </div>
          </div>

          <div class="colophon-side">
            ${tilesHtml ? `<div class="colophon-tiles">${tilesHtml}</div>` : ""}
            ${bio ? `<p class="colophon-hand">${escapeHtml(bio)}</p>` : ""}
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* 03 — every single day: an intro column, then one tile per item          */
  /* ---------------------------------------------------------------------- */

  // Label and name sit tight under their own photograph — one unit, one
  // colour. Previously the label floated to the opposite edge of a full-width
  // row, so at a glance it read as belonging to the neighbouring item.
  function renderDaily(sections, lang) {
    const items = [];
    (sections || []).forEach((sec) => (sec.items || []).forEach((it) => { if (it.dailyUse) items.push(it); }));
    if (!items.length) return "";

    const pool = collectPhotos({ sections });

    const tiles = items.map((it, i) => {
      const name = f(it, "name", lang);
      const label = f(it, "label", lang);
      const url = safeUrl(it.image) || pick(pool, i);
      const href = safeUrl(it.url);

      const inner = `${frame(url, { ratio: "1x1", alt: name, className: "daily-photo" })}
        ${label ? `<span class="t-meta daily-label">${escapeHtml(label)}</span>` : ""}
        <span class="daily-name">${escapeHtml(name)}</span>`;

      return href
        ? `<a class="daily-tile" href="${escapeHtml(href)}" target="_blank" rel="noopener sponsored" data-track-id="${escapeHtml(it.id || "")}">${inner}</a>`
        : `<div class="daily-tile">${inner}</div>`;
    }).join("");

    return `<section class="page page--ink-deep daily" aria-label="${escapeHtml(t(lang, "daily"))}">
      <div class="daily-grid">
        <div class="daily-intro">
          <p class="t-meta daily-lbl">✦ ${escapeHtml(t(lang, "daily"))}</p>
          <p class="t-body daily-desc">${escapeHtml(t(lang, "dailyDesc"))}</p>
          ${doodleRule()}
        </div>
        ${tiles}
      </div>
    </section>`;
  }

  /* ---------------------------------------------------------------------- */
  /* fiches                                                                 */
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
    const flag = isArchive ? t(lang, "tried") : (item.affilliate ? t(lang, "affiliate") : "");
    if (!label && !flag) return "";
    return `<div class="fiche-label">
      ${label ? `<span>✦ ${escapeHtml(label)}</span>` : ""}
      ${flag ? `<span class="fiche-flag">${escapeHtml(flag)}</span>` : ""}
    </div>`;
  }

  // A chapter item: copy in one grid track, up to two numbered square frames
  // in the others. The number of frames drives the track sizes, so the grid
  // never has a hole — and with no photographs at all the copy simply runs at
  // a reading measure instead of sitting beside an empty box.
  //
  // Hierarchy answers three questions in order: what is it (eyebrow + name),
  // why is it here (a short line), what do I do now (CTA). Sides alternate by
  // position so a long chapter still reads with rhythm.
  function ficheItem(item, lang, index) {
    const name = f(item, "name", lang);
    const label = f(item, "label", lang);
    const desc = f(item, "description", lang);
    const num = pad2(null, index);

    const cover = safeUrl(item.image);
    const extra = (item.gallery || []).map(safeUrl).filter(Boolean);

    const overlay = editorialOverlay(item, lang, num);
    const gesture = blockGesture(item, lang, num);
    const style = mediaStyle(item);

    const f1 = frame(cover, {
      ratio: "1x1",
      alt: name,
      num: `${t(lang, "frame")} 01${label ? ` — ${label}` : ""}`,
      overlay,
      style,
      className: "fiche-frame",
    });

    let f2 = "";
    if (extra.length === 1) {
      f2 = frame(extra[0], {
        ratio: "1x1",
        alt: `${name} — 2`,
        num: `${t(lang, "frame")} 02`,
        className: "fiche-frame",
      });
    } else if (extra.length > 1) {
      f2 = carouselFrame(extra, name, lang, `${t(lang, "frame")} 02`);
    }

    const frames = (f1 ? 1 : 0) + (f2 ? 1 : 0);
    const flip = index % 2 === 1 && frames > 0 ? " fiche--flip" : "";

    return `<article class="fiche fiche--item frames-${frames}${flip}">
      <div class="fiche-body">
        ${ficheLabel(item, lang, false)}
        <h3 class="fiche-name">${escapeHtml(name)}</h3>
        ${desc ? `<p class="fiche-desc">${escapeHtml(desc)}</p>` : ""}
        ${ficheActions(item, lang)}
        ${gesture}
      </div>
      ${f1}${f2}
    </article>`;
  }

  // Archive line. Dense and fast — used for the "already tried" section only,
  // never mixed into a chapter's primary list.
  function ficheC(item, lang, isArchive) {
    const desc = f(item, "description", lang);
    return `<article class="fiche fiche--c">
      ${ficheLabel(item, lang, isArchive)}
      <div class="fiche-row">
        <h3 class="fiche-name">${escapeHtml(f(item, "name", lang))}</h3>
        ${ficheActions(item, lang)}
      </div>
      ${desc ? `<p class="fiche-desc">${escapeHtml(desc)}</p>` : ""}
    </article>`;
  }

  /* ---------------------------------------------------------------------- */
  /* chapters                                                               */
  /* ---------------------------------------------------------------------- */

  // Every item renders open, in the server HTML. The chapter used to be a
  // click-to-reveal accordion, which meant the page shipped with its content
  // hidden, cost a click to read anything, and reflowed the whole document on
  // every toggle. The outlined numeral now sits BESIDE the solid title rather
  // than behind it, so it can never clip a letter.
  function renderChapter(sec, lang, meta) {
    const items = sec.items || [];
    const title = f(sec, "title", lang);
    const countTxt = `${items.length} ${items.length === 1 ? t(lang, "item") : t(lang, "items")}`;
    const metaTxt = [`${t(lang, "chapter")} ${meta.num}`, sec.category, countTxt].filter(Boolean).join(" · ");

    return `<section class="page ${meta.palette} chapter" id="${escapeHtml(meta.anchor)}"
             data-chapter="${escapeHtml(meta.num)}" data-chapter-title="${escapeHtml(title)}" data-palette="${escapeHtml(meta.palette)}">
      <div class="chapter-in">
        <div class="chapter-head">
          <span class="chapter-num" aria-hidden="true">${escapeHtml(meta.num)}</span>
          <h2 class="chapter-title">${escapeHtml(title)}</h2>
          <span class="t-meta chapter-meta">${escapeHtml(metaTxt)}</span>
        </div>
        ${doodleUnderline()}
        <div class="chapter-items">${items.map((it, i) => ficheItem(it, lang, i)).join("")}</div>
      </div>
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
      <div class="archive-in">
        <div class="section-head">
          <span class="t-meta section-lbl">✦ ${escapeHtml(t(lang, "archiveTitle"))}</span>
          <span class="t-meta section-sub">${escapeHtml(t(lang, "archiveDesc"))}</span>
        </div>
        <div class="chapter-items">
          ${items.map((it) => ficheC(it, lang, true)).join("")}
        </div>
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

  // The disclosure a reader is legally entitled to read, so it's set at body
  // size in --muted — not the 10.5px/30%-opacity whisper it used to be.
  function renderFootnote(site, lang) {
    const note = f(site, "affiliateNote", lang);
    if (!site.showAffiliateNote || !note) return "";
    return `<aside class="page page--ink footnote">
      <div class="footnote-grid">
        <p class="t-meta footnote-lbl">✦ ${escapeHtml(t(lang, "affiliateTitle"))}</p>
        <p class="t-body footnote-body">${escapeHtml(note)}</p>
      </div>
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

    // The cover's headline comes back one last time, oversized — the same
    // sentence the publication opened with now closes it.
    const signoff = f(s, "headline", lang) || (lang === "en" ? "it's just an espresso." : "é só um café.");

    const gearRows = gear.map((g) => `<div class="gear-row">
      ${g.label ? `<span class="gear-label">${escapeHtml(g.label)}</span>` : ""}
      <span class="gear-value">${escapeHtml(g.value)}</span>
    </div>`).join("");

    return `<footer class="page page--ink-deep backcover">
      <div class="backcover-in">
        <div class="backcover-masthead">
          <span class="t-meta backcover-issue">${escapeHtml(t(lang, "thisIssue"))} — ${year}</span>
          <p class="backcover-credits">${escapeHtml(t(lang, "creditsBy"))} ${escapeHtml(p.name || "")}${credits ? ` — ${escapeHtml(credits)}` : ""}</p>
        </div>

        ${gearRows ? `<div class="backcover-gear">
          <span class="t-meta gear-heading">✦ ${escapeHtml(t(lang, "gearHeading"))}</span>
          <div class="gear-list">${gearRows}</div>
        </div>` : ""}

        ${thanks ? `<div class="backcover-note">
          ${thanksLede ? `<p class="note-lede">${escapeHtml(thanksLede)}</p>` : ""}
          ${thanksRest ? `<p class="note-rest">${escapeHtml(thanksRest)}</p>` : ""}
        </div>` : ""}

        <p class="backcover-signoff">${escapeHtml(signoff)}</p>
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
  /* chapter planning — shared by the page, the contents list and the index  */
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

  /* ---------------------------------------------------------------------- */
  /* masthead — the publication header                                       */
  /* ---------------------------------------------------------------------- */

  // Lives here, in the isomorphic module, rather than as a template literal
  // inside api/index.js: the masthead carries five pieces of translatable
  // copy (the chapter list, the edition line, "contents", the nav's own
  // accessible name, the wordmark) and it used to be server-rendered PT-only,
  // so switching to EN left the one bar the reader looks at still in
  // Portuguese. Now the client repaints it from the same function.
  //
  // Every interactive element in here (#btn-pt, #btn-en, #index-btn) is driven
  // by delegated listeners on document in site-client.js — nothing may bind
  // directly to these nodes, because this whole subtree is replaced on a
  // language switch.
  function renderMasthead(data, lang) {
    const p = data.profile || {};
    const chapters = planChapters(data.sections || [], lang);
    const year = new Date().getFullYear();

    const navItems = chapters.map((c, i) =>
      `<a href="#${escapeHtml(c.anchor)}" data-nav-link data-anchor="${escapeHtml(c.anchor)}"><span class="n">${escapeHtml(String(i + 1).padStart(2, "0"))}</span>${escapeHtml(c.title)}</a>`
    ).join("");

    return `<header class="masthead" id="masthead">
  <div class="masthead-in">
    <a class="mast-brand" href="#capa">
      <span class="star" aria-hidden="true">✦</span>${escapeHtml(f(p, "name", lang) || "gabriel no café")}
    </a>
    <nav class="mast-nav" aria-label="${escapeHtml(t(lang, "chapters"))}">
      ${navItems}
    </nav>
    <div class="mast-folio" id="folio" aria-live="polite"></div>
    <div class="mast-right">
      <span class="mast-edition">${escapeHtml(t(lang, "thisIssue"))} — ${year}</span>
      <button class="mast-index-btn" id="index-btn" type="button" aria-expanded="false" aria-controls="index-overlay">
        <span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>
        ${escapeHtml(t(lang, "contents"))}
      </button>
      <div class="lang">
        <button id="btn-pt" class="${lang === "pt" ? "active" : ""}" type="button" aria-label="Português" aria-pressed="${lang === "pt" ? "true" : "false"}">pt</button>
        <span class="sep" aria-hidden="true">·</span>
        <button id="btn-en" class="${lang === "en" ? "active" : ""}" type="button" aria-label="English" aria-pressed="${lang === "en" ? "true" : "false"}">en</button>
      </div>
    </div>
  </div>
</header>`;
  }

  // The contents overlay: a real magazine index. Groups by category when there
  // are enough distinct ones to be worth grouping.
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
        return `<div class="index-group-label" role="heading" aria-level="3">${escapeHtml(cat)}</div>${inCat.map(rowFor).join("")}`;
      }).join("");
      const uncat = chapters.filter((c) => !c.category);
      if (uncat.length) body += uncat.map(rowFor).join("");
    } else {
      body = chapters.map(rowFor).join("");
    }

    const hasArchive = (data.sections || []).some((s) => s.group === "other" && (s.items || []).length);

    return `<div class="index-overlay" id="index-overlay" role="dialog" aria-modal="true" aria-label="${escapeHtml(t(lang, "contentsTitle"))}">
      <div class="index-top">
        <span class="lbl">✦ ${escapeHtml(t(lang, "contentsTitle"))}</span>
        <button class="index-close" type="button" id="index-close">${escapeHtml(t(lang, "close"))} ✕</button>
      </div>
      <nav class="index-list">
        ${body}
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
    const s = d.site || {};
    const sections = d.sections || [];

    const chapters = planChapters(sections, lang);
    const chapterHtml = chapters.map((meta) => renderChapter(meta.sec, lang, meta)).join("");

    return [
      renderCover(d, lang),
      renderColophon(d, lang),
      renderDaily(sections, lang),
      chapterHtml,
      renderArchive(sections, lang),
      renderFootnote(s, lang),
      renderBackCover(d, lang),
      renderIndexOverlay(d, lang),
    ].join("\n");
  }

  return {
    t, tf, I18N, escapeHtml, f, safeUrl, slug, planChapters,
    renderApp, renderMasthead, renderIndexOverlay, renderSocials,
  };
});
