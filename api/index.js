// api/index.js — Vercel Serverless Function that server-renders "/".
// Crawlers and first paint get the real publication (no "carregando…"), then
// public/site-client.js hydrates for language switching, the contents overlay
// and motion — reusing the same render functions from public/render-shared.js.

const { getData } = require("../lib/store.js");
const { renderApp, renderIndexOverlay, escapeHtml, f, t, planChapters } = require("../public/render-shared.js");

const SITE_URL_FALLBACK = "gabrielnocafe.vercel.app";
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23e8a856' d='M10 0 11.5 8 20 10 11.5 12 10 20 8.5 12 0 10 8.5 8Z'/%3E%3C/svg%3E";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");

  const data = await getData();
  const p = data.profile || {};
  const s = data.site || {};
  const lang = "pt";

  const host = req.headers.host || SITE_URL_FALLBACK;
  const canonical = `https://${host}/`;
  const ogImage = `https://${host}/api/og`;
  const metaTitle = "Gabriel no Café — Setup, Coffee & Creativity";
  const metaDesc = "Meu setup de café, equipamentos que uso, receitas e outras coisas que fazem parte do Gabriel no Café.";

  const bodyHtml = renderApp(data, lang);
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");

  // The masthead reads as a publication header: wordmark, a numbered contents
  // list distributed across the bar (desktop), and a running folio that fills
  // in with the current chapter as you scroll.
  const chapters = planChapters(data.sections || [], lang);
  const navItems = chapters.slice(0, 3).map((c, i) =>
    `<a href="#${escapeHtml(c.anchor)}"><span class="n">${escapeHtml(String(i + 1).padStart(2, "0"))}</span>${escapeHtml(c.title)}</a>`
  ).join("");

  const mastheadHtml = `
<header class="masthead" id="masthead">
  <div class="masthead-in">
    <a class="mast-brand" href="#capa">
      <span class="star" aria-hidden="true">✦</span>${escapeHtml(f(p, "name", lang) || "gabriel no café")}
    </a>
    <nav class="mast-nav" aria-label="capítulos">
      ${navItems}
    </nav>
    <div class="mast-folio" id="folio" aria-live="polite"></div>
    <div class="mast-right">
      <button class="mast-index-btn" id="index-btn" type="button" aria-expanded="false" aria-controls="index-overlay">
        <span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>
        ${escapeHtml(t(lang, "contents"))}
      </button>
      <div class="lang">
        <button id="btn-pt" class="active" type="button" aria-label="Português">pt</button>
        <span class="sep" aria-hidden="true">·</span>
        <button id="btn-en" type="button" aria-label="English">en</button>
      </div>
    </div>
  </div>
</header>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}" />
  <meta name="theme-color" content="#14100c" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <link rel="icon" href="${FAVICON}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(metaTitle)}" />
  <meta property="og:description" content="${escapeHtml(metaDesc)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:site_name" content="${escapeHtml(f(p, "name", lang) || "Gabriel no Café")}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Fredoka:wght@600;700&family=Caveat:wght@600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/site.css" />
</head>
<body>
${mastheadHtml}
<main id="app">${bodyHtml}</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>window.__SITE_DATA__ = ${dataJson}; window.__SITE_LANG__ = ${JSON.stringify(lang)};</script>
<script src="/render-shared.js"></script>
<script src="/site-client.js"></script>
</body>
</html>`);
};
